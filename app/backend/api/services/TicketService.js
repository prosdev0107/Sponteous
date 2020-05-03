"use strict";

const { Ticket, Trip, TicketOwner, User, Order } = require("../models");
const crypto = require("crypto");
const Aggregate = require("./Aggregate");
const RedisService = require("./RedisService");
const PaymentService = require("./PaymentService");
const EmailService = require("./EmailService");
const redis = require("redis");
const client1 = redis.createClient({
  host: global.config.connection.redis.host,
  db: 1,
});
// const subscriber1 = redis.createClient({ host: global.config.connection.redis.host, db: 1 });
const custom = require("../../config/custom");
const ObjectId = require("mongoose").Types.ObjectId;
const photoPrefix = "data:image/png;base64,";
var fs = require("fs");
const PHOTO_ENCODING = "Base64";
const PHOTO_DIR_PATH = "./city_photos/";
const BASE_64_PHOTO_ENCODING = "Base64";
const DEFAULT_PHOTO =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
var Agenda = require("agenda");
const { user, password, host, port, name } = global.config.connection.database;

const agenda = new Agenda({
  db: { address: `mongodb+srv://${user}:${password}@${host}/${name}` },
});

// client1.send_command('config', ['set', 'notify-keyspace-events', 'Ex'], onExpiredTicket);

// function onExpiredTicket(err, res) {
//   return new Promise((resolve, reject) => {
//     if (err) return reject(err);

//     subscriber1.subscribe('__keyevent@1__:expired', function () {
//       subscriber1.on('message', (channel, owner) => {

//         TicketOwner.findOne({ owner })
//           .then(ownerInfo => {
//             if (!ownerInfo) return resolve();

//             // Gather selected tickets
//             const tickets = [];
//             ownerInfo.trips.filter(x => {
//               if (!x.deselected) {
//                 tickets.push(x.arrivalTicket);
//                 tickets.push(x.departureTicket);
//               }
//             });

//             // Gather selected trips
//             const trips = [];
//             ownerInfo.trips.filter(x => {
//               if (!x.deselected) trips.push(x.trip);
//             });

//             removeDeletedTickets(tickets, ownerInfo.quantity)
//               .then(() => removeDeletedTrips(trips))
//               .then(resolve)
//               .catch(resolve);
//           })
//           .then(resolve)
//           .catch(resolve);

//         async function removeDeletedTickets(tickets, quantity) {
//           for (let ticketId of tickets) {
//             const ticket = await Ticket.findById(ticketId);

//             if (ticket.deleted)
//               if (ticket.blockedQuantity.length <= 1)
//                 await Ticket.deleteOne({ _id: ticketId });
//               else
//                 await Ticket.updateOne({ _id: ticketId }, { $pull: { blockedQuantity: { owner } } });
//             else
//               await Ticket.updateOne({
//                 _id: ticketId
//               }, {
//                 $inc: { reservedQuantity: -quantity },
//                 $pull: { blockedQuantity: { owner } }
//               });
//           }
//         }

//         async function removeDeletedTrips(trips) {
//           for (let tripId of trips) {
//             const ticketsOfTrip = await Ticket.estimatedDocumentCount({ trip: tripId });

//             if (!ticketsOfTrip)
//               await Trip.deleteOne({ _id: tripId, deleted: true });
//           }

//           return;
//         }
//       });
//     });
//   });
// }

function setMonday(date) {
  date = new Date(date);
  const day = date.getDay() || 7;
  if (day !== 1) {
    let hour = date.getHours();
    let minutes = date.getMinutes();
    date.setHours(-24 * (day - 1));
    date.setHours(hour);
    date.setMinutes(minutes);
  }
  return date.getTime();
}

async function createManyTickets(data) {
  if (data.repeat.dateEnd <= data.date.start)
    throw { status: 400, message: "TICKET.REPEAT.BAD.DATEEND" };
  // set correctly hour
  data.repeat.dateEnd = new Date(data.repeat.dateEnd).setHours(
    new Date(data.date.start).getHours(),
    0,
    0,
    0
  );

  let dateBase = {
    start: setMonday(data.date.start),
    end: setMonday(data.date.end),
  };

  let seedDate;
  const updateMessages = [];

  for (let offset = 0; true; offset += 7) {
    for (let day of data.repeat.days) {
      seedDate = {
        start:
          dateBase.start + (day + offset - 1) * global.config.custom.time.day,
        end: dateBase.end + (day + offset - 1) * global.config.custom.time.day,
      };

      if (data.repeat.dateEnd < seedDate.start) break;
      if (data.date.start <= seedDate.start) {
        let ticket = await Ticket.findOne({
          trip: data.trip,
          departure: data.departure,
          destination: data.destination,
          date: {
            start: new Date(seedDate.start),
            end: new Date(seedDate.end),
          },
        });

        if (ticket) {
          await Ticket.updateOne(
            { _id: ticket._id },
            { $inc: { quantity: data.quantity } }
          );
          updateMessages.push(new Date(seedDate.start).getTime());
        } else {
          ticket = await Ticket.create({ ...data, date: seedDate });
          await Trip.findByIdAndUpdate(
            data.trip,
            { $addToSet: { tickets: ticket._id } },
            { new: true }
          );
        }
      }
    }

    if (data.repeat.dateEnd < seedDate.start) break;
  }

  //return updateMessages.length ? { updated: true, dates: updateMessages } : {};
}
async function hasOpposite(trip) {
  // const oppositeTrip = await Trip.findOne({destination: trip.departure, departure: trip.destination,
  //                   carrier: trip.carrier, type: trip.type}).sort({destination : 1})

  const oppositeTrip = await Trip.aggregate([
    {
      $match: {
        destination: trip.departure,
        departure: trip.destination,
        carrier: trip.carrier,
        type: trip.type,
      },
    },
    {
      $lookup: {
        from: "tickets",
        localField: "tickets",
        foreignField: "_id",
        as: "tickets_data",
      },
    },
  ]);
  if (oppositeTrip != undefined) return oppositeTrip;

  return null;
}
async function bookWithOutTime({ Adult, Youth, selectedTrip, owner }) {
  const quantity = Adult + Youth;
  // if (new Date(selectedTrip.dateStart) < custom.TodayWithTimezone + global.config.custom.time.day)
  if (new Date(selectedTrip.dateStart) < custom.TodayWithTimezone)
    throw {
      status: 400,
      message: "TICKET.DATE.START.INVALID%",
      args: [
        new Date(Date.now() + global.config.custom.time.day).toDateString(),
      ],
    };
  // if (new Date(selectedTrip.dateEnd) < custom.TodayWithTimezone + global.config.custom.time.day)
  if (new Date(selectedTrip.dateEnd) < custom.TodayWithTimezone)
    throw {
      status: 400,
      message: "TICKET.DATE.END.INVALID%",
      args: [
        new Date(Date.now() + global.config.custom.time.day).toDateString(),
      ],
    };
  const trip = await Trip.findOne({
    _id: ObjectId(selectedTrip.id),
    deleted: false,
    active: true,
  });
  if (!trip) throw { status: 404, message: "TRIP.NOT.EXIST" };
  const [arrivalTicket] = await Ticket.aggregate([
    {
      $project: {
        quantity: {
          $gte: [
            "$quantity",
            { $sum: ["$soldTickets", "$reservedQuantity", quantity] },
          ],
        },
        isgte: {
          $gte: [
            "$date.start",
            new Date(new Date(selectedTrip.dateStart).setHours(0, 0, 0, 0)),
          ],
        },
        islte: {
          $lte: [
            "$date.start",
            new Date(
              new Date(selectedTrip.dateStart).setHours(23, 59, 59, 999)
            ),
          ],
        },
        active: 1,
        deleted: 1,
        departure: 1,
        destination: 1,
        obj: "$$ROOT",
      },
    },
    {
      $match: {
        isgte: true,
        islte: true,
        quantity: true,
        active: true,
        deleted: false,
        departure: trip.departure.name,
        destination: trip.destination.name,
      },
    },
    { $replaceRoot: { newRoot: "$obj" } },
    { $limit: 1 },
  ]);
  if (!arrivalTicket)
    throw {
      status: 404,
      message: "TICKET.ARRIVAL.NOT.EXIST%",
      args: [new Date(selectedTrip.dateStart).toDateString()],
    };
  const [departureTicket] = await Ticket.aggregate([
    {
      $project: {
        quantity: {
          $gte: [
            "$quantity",
            { $sum: ["$soldTickets", "$reservedQuantity", quantity] },
          ],
        },
        isgte: {
          $gte: [
            "$date.start",
            new Date(new Date(selectedTrip.dateEnd).setHours(0, 0, 0, 0)),
          ],
        },
        islte: {
          $lte: [
            "$date.start",
            new Date(new Date(selectedTrip.dateEnd).setHours(23, 59, 59, 999)),
          ],
        },
        active: 1,
        deleted: 1,
        departure: 1,
        destination: 1,
        obj: "$$ROOT",
      },
    },
    {
      $match: {
        quantity: true,
        isgte: true,
        islte: true,
        active: true,
        deleted: false,
        departure: trip.destination.name,
        destination: trip.departure.name,
      },
    },
    { $replaceRoot: { newRoot: "$obj" } },
    { $limit: 1 },
  ]);
  if (!departureTicket)
    throw {
      status: 404,
      message: "TICKET.DEPARTURE.NOT.EXIST%",
      args: [new Date(selectedTrip.dateEnd).toDateString()],
    };
  let reservedArrivalTicket;
  if (
    quantity <=
    arrivalTicket.quantity -
      arrivalTicket.soldTickets -
      arrivalTicket.reservedQuantity
  ) {
    reservedArrivalTicket = await Ticket.findOneAndUpdate(
      {
        _id: arrivalTicket._id,
        active: true,
        deleted: false,
        quantity: { $gte: quantity },
      },
      {
        $inc: { reservedQuantity: quantity },
        $addToSet: { blockedQuantity: { owner, quantity } },
      },
      { new: true }
    );
    if (!reservedArrivalTicket)
      throw {
        status: 404,
        message: "TICKET.ARRIVAL.NOT.EXIST%",
        args: [new Date(selectedTrip.dateStart).toDateString()],
      };
  } else {
    throw {
      status: 404,
      message: "TICKET.BOOK.NOT.ENOUGH",
      args: [new Date(selectedTrip.dateEnd).toDateString()],
    };
  }
  let reservedDepartureTicket;
  if (
    quantity <=
    departureTicket.quantity -
      departureTicket.soldTickets -
      departureTicket.reservedQuantity
  ) {
    reservedDepartureTicket = await Ticket.findOneAndUpdate(
      {
        _id: departureTicket._id,
        active: true,
        deleted: false,
        quantity: { $gte: quantity },
      },
      {
        $inc: { reservedQuantity: quantity },
        $addToSet: { blockedQuantity: { owner, quantity } },
      },
      { new: true }
    );
    if (!reservedDepartureTicket)
      throw {
        status: 404,
        message: "TICKET.ARRIVAL.NOT.EXIST%",
        args: [new Date(selectedTrip.dateStart).toDateString()],
      };
  } else {
    throw {
      status: 404,
      message: "TICKET.BOOK.NOT.ENOUGH",
      args: [new Date(selectedTrip.dateEnd).toDateString()],
    };
  }

  const oppositeTrip = await hasOpposite(trip);

  const updatedTicketOwner = await TicketOwner.findOneAndUpdate(
    {
      owner,
    },
    {
      owner,
      quantity: quantity,
      $inc: { billing: trip.adultPrice * quantity },
      $addToSet: {
        trips: {
          trip: trip._id,
          arrivalTicket: reservedArrivalTicket._id,
          departureTicket: reservedDepartureTicket._id,
          cost:
            trip.adultPrice * Adult +
            trip.childPrice * Youth +
            oppositeTrip[0].adultPrice * Adult +
            oppositeTrip[0].childPrice * Youth,
        },
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );

  return;
}

async function unbook({ owner, selectedTrip }) {
  const trip = await Trip.findOne({ _id: selectedTrip });
  if (!trip) throw { status: 404, message: "TRIP.NOT.EXIST" };

  const ownerInfo = await TicketOwner.findOne({ owner });
  if (!ownerInfo) throw { status: 404, message: "TICKET.OWNER.NOT.EXIST" };
  if (!ownerInfo.trips.length)
    throw { status: 404, message: "TICKET.OWNER.NOT.EXIST" };

  for (const reserved of ownerInfo.trips)
    if (`${reserved.trip}` === `${trip._id}`) {
      const tickets = await Ticket.find({
        _id: { $in: [reserved.arrivalTicket, reserved.departureTicket] },
      });
      if (tickets.length !== 2)
        throw { status: 404, message: "TICKET.NOT.FOUND" };

      const unbookedArrivalTicket = await Ticket.findOneAndUpdate(
        { _id: reserved.arrivalTicket },
        {
          $inc: { reservedQuantity: -ownerInfo.quantity },
          $pull: { blockedQuantity: { owner } },
        },
        { new: true }
      );
      if (unbookedArrivalTicket.deleted)
        await this.destroy(unbookedArrivalTicket._id);

      const unbookedDepartureTicket = await Ticket.findOneAndUpdate(
        { _id: reserved.departureTicket },
        {
          $inc: { reservedQuantity: -ownerInfo.quantity },
          $pull: { blockedQuantity: { owner } },
        },
        { new: true }
      );
      if (unbookedArrivalTicket.deleted)
        await this.destroy(unbookedDepartureTicket._id);

      const ticketOwnerUpdated = await TicketOwner.updateOne(
        {
          _id: ownerInfo._id,
          "trips._id": reserved._id,
        },
        {
          $inc: { billing: -reserved.cost },
          $set: { "trips.$.deselected": true },
        }
      );
    }

  return;
}

async function bookWithTime({ Adult, Youth, selectedTrip, owner }) {
  const quantity = Adult + Youth;
  const arrivalTicket = await Ticket.findOne({
    _id: selectedTrip.arrivalTicket,
    active: true,
    deleted: false,
  });
  if (!arrivalTicket)
    throw { status: 404, message: "TICKET.ARRIVAL.NOT.EXIST" };

  // Check if ticket are in future
  if (
    +new Date(arrivalTicket.date.start) <
    custom.TodayWithTimezone + global.config.custom.time.day
  )
    throw {
      status: 400,
      message: "TICKET.DATE.START.INVALID%",
      args: [
        new Date(Date.now() + global.config.custom.time.day).toDateString(),
      ],
    };

  const departureTicket = await Ticket.findOne({
    _id: selectedTrip.departureTicket,
    active: true,
    deleted: false,
    quantity: { $gte: quantity },
  });
  if (!departureTicket)
    throw { status: 404, message: "TICKET.DEPARTURE.NOT.EXIST" };

  // Check if ticket are in future
  if (
    +new Date(departureTicket.date.start) <
    custom.TodayWithTimezone + global.config.custom.time.day
  )
    throw {
      status: 400,
      message: "TICKET.DATE.END.INVALID%",
      args: [
        new Date(Date.now() + global.config.custom.time.day).toDateString(),
      ],
    };
  let reservedArrivalTicket;
  let reservedDepartureTicket;
  if (
    quantity <=
      arrivalTicket.quantity -
        arrivalTicket.soldTickets -
        arrivalTicket.reservedQuantity &&
    quantity <=
      departureTicket.quantity -
        departureTicket.soldTickets -
        departureTicket.reservedQuantity
  ) {
    reservedArrivalTicket = await Ticket.findOneAndUpdate(
      {
        _id: selectedTrip.arrivalTicket,
        active: true,
        deleted: false,
        quantity: { $gte: quantity /*+ reservedQuantity + soldTickets*/ },
      },
      {
        $inc: { reservedQuantity: quantity },
        $addToSet: { blockedQuantity: { owner, quantity } },
      },
      { new: true }
    );

    reservedDepartureTicket = await Ticket.findOneAndUpdate(
      {
        _id: selectedTrip.departureTicket,
        active: true,
        deleted: false,
        quantity: { $gte: quantity /*+ reservedQuantity + soldTickets*/ },
      },
      {
        $inc: { reservedQuantity: quantity },
        $addToSet: { blockedQuantity: { owner, quantity } },
      },
      { new: true }
    );
  } else {
    throw {
      status: 404,
      message: "TICKET.BOOK.NOT.ENOUGH",
      args: [
        new Date(Date.now() + global.config.custom.time.day).toDateString(),
      ],
    };
  }

  const trip = await Trip.findById(reservedArrivalTicket.trip);
  const oppositeTrip = await hasOpposite(trip);

  await TicketOwner.findOneAndUpdate(
    {
      owner,
    },
    {
      owner,
      quantity: quantity,
      timeSelected: true,
      $addToSet: {
        trips: {
          trip: trip._id,
          arrivalTicket: reservedArrivalTicket._id,
          departureTicket: reservedDepartureTicket._id,
          cost:
            trip.adultPrice * Adult +
            trip.childPrice * Youth +
            oppositeTrip[0].adultPrice * Adult +
            oppositeTrip[0].childPrice * Youth,
        },
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );

  return;
}

/*
  Remove Ticket from Reserved Tickets If User didnt Book
*/
agenda.define("remove-ticket", (job) => {
  TicketOwner.findById(job.attrs.data.data, (err, owner) => {
    let ownerId = owner.owner;
    let quantity = owner.quantity;

    if (!owner.paid) {
      owner.trips.forEach((trip) => {
        let departureTicket = trip.departureTicket;
        let arrivalTicket = trip.arrivalTicket;

        Ticket.findById(departureTicket, _ticketHandle);
        Ticket.findById(arrivalTicket, _ticketHandle);
      });
    }

    function _ticketHandle(err, ticket) {
      if (err) {
        return console.error(err);
      }

      let ifFound = ticket.blockedQuantity.filter((x) => x.owner == ownerId);
      if (ifFound.length > 0) {
        ticket.reservedQuantity = ticket.reservedQuantity - quantity;
        ticket.save({});
      }
    }
  });
});

module.exports = {
  async create(data) {
    const trip = await Trip.findOne({ _id: data.trip, deleted: false });
    if (!trip) throw { status: 404, message: "TRIP.NOT.EXIST" };
    data["carrier"] = trip.carrier;
    data["adultPrice"] = trip.adultPrice;
    data["childPrice"] = trip.childPrice;
    if (data.departureHours.length) {
      for (let hours of data.departureHours) {
        data.date = hours;
        if (data.repeat) {
          // create many
          createManyTickets(data);
        } else {
          // create one
          let ticket = await Ticket.findOne({
            trip: data.trip,
            departure: data.departure,
            destination: data.destination,
            date: {
              start: new Date(data.date.start),
              end: new Date(data.date.end),
            },
          });
          if (ticket) {
            ticket = await Ticket.updateOne(
              { _id: ticket._id },
              { $inc: { quantity: data.quantity } },
              { new: true }
            );

            //return { ...ticket, updated: true };
          } else {
            ticket = await Ticket.create(data);
            await Trip.findByIdAndUpdate(
              data.trip,
              { $addToSet: { tickets: ticket._id } },
              { new: true }
            );

            //return { ...ticket.toObject(), updated: false };
          }
        }
      }
    } else {
      if (data.repeat) {
        // create many
        return createManyTickets(data);
      } else {
        // create one
        let ticket = await Ticket.findOne({
          trip: data.trip,
          departure: data.departure,
          destination: data.destination,
          date: {
            start: new Date(data.date.start),
            end: new Date(data.date.end),
          },
        });
        if (ticket) {
          ticket = await Ticket.updateOne(
            { _id: ticket._id },
            { $inc: { quantity: data.quantity } },
            { new: true }
          );

          return { ...ticket, updated: true };
        } else {
          ticket = await Ticket.create(data);
          await Trip.findByIdAndUpdate(
            data.trip,
            { $addToSet: { tickets: ticket._id } },
            { new: true }
          );

          return { ...ticket.toObject(), updated: false };
        }
      }
    }
  },

  async book({ Adult, Youth, trips, ownerHash }) {
    Adult = +Adult;
    Youth = +Youth;

    if (ownerHash) {
      const isOwnerExist = await TicketOwner.findOne({ owner: ownerHash });
      if (isOwnerExist) return isOwnerExist;
    }
    const owner = crypto.randomBytes(40).toString("hex");

    for (let selectedTrip of trips) {
      if (selectedTrip.arrivalTicket || selectedTrip.departureTicket) {
        await bookWithTime({ Adult, Youth, selectedTrip, owner });
      } else {
        await bookWithOutTime({ Adult, Youth, selectedTrip, owner });
      }
    }

    const ownerInfo = await TicketOwner.findOne({ owner });
    await RedisService.set(client1, `${owner}`, "", 30);

    // agenda.start();
    // agenda.schedule('in 16 minutes', 'remove-ticket', { data: ownerInfo.id });

    return ownerInfo;
  },

  async unbook({ owner, trips }) {
    for (let selectedTrip of trips) {
      await unbook({ selectedTrip, owner });
    }

    return TicketOwner.findOne({ owner });
  },

  async buy({ owner, creditCardToken, buyerInfo }) {
    const ownerInfo = await TicketOwner.findOne({ owner });
    if (!ownerInfo) throw { status: 404, message: "BUY.OWNER.NOT.EXIST" };

    ownerInfo.trips = await populateTrips(ownerInfo.trips);
    let finalCost = 0;
    const [admin] = await User.find({
      role: global.config.custom.roles.ADMINISTRATOR,
    })
      .sort("_id")
      .limit(1);

    const selectedTrip = getMostExpensiveTrip(ownerInfo);
    if (!selectedTrip) throw { status: 404, message: "BUY.TRIP.NOT.EXIST" };

    if (
      selectedTrip.tickets <= selectedTrip.soldTickets ||
      ownerInfo.quantity > selectedTrip.quantity - selectedTrip.soldTickets
    )
      throw {
        status: 404,
        message: "TICKET.BOOK.NOT.ENOUGH",
        args: [
          new Date(Date.now() + global.config.custom.time.day).toDateString(),
        ],
      };
    // Add a trip price (time choose already added)
    finalCost += selectedTrip.cost;

    // Add a price for deselection trips
    const deselectionPrice = calculateDeselectionPrice(ownerInfo.trips);
    finalCost += deselectionPrice;

    const charge = await PaymentService.charge(
      finalCost,
      creditCardToken,
      buyerInfo,
      selectedTrip
    );

    ownerInfo.trips.map(async (selectedTrip) => {
      await clearReservation(selectedTrip, owner);
    });

    const order = await Order.create({
      buyer: {
        name: buyerInfo.middleName
          ? `${buyerInfo.firstName} ${buyerInfo.middleName} ${buyerInfo.lastName}`
          : `${buyerInfo.firstName} ${buyerInfo.lastName}`,
        phone: buyerInfo.phone,
        email: buyerInfo.email,
        birthDate: buyerInfo.birthDate,
        address: buyerInfo.address,
        city: buyerInfo.city,
        zipCode: buyerInfo.zipCode,
      },
      stripeChargeId: charge.id,
      selected: ownerInfo.timeSelected
        ? ownerInfo.trips.map((x) => ({
            name: x.trip.destination.name,
            price: x.cost,
            date: {
              arrival: {
                start: x.arrivalTicket.date.start,
                end: x.arrivalTicket.date.end,
              },
              departure: {
                start: x.departureTicket.date.start,
                end: x.departureTicket.date.end,
              },
            },
          }))
        : ownerInfo.trips.map((x) => ({
            name: x.trip.destination.name,
            price: x.cost,
          })),
      deselected: ownerInfo.trips
        .filter((x) => x.deselected)
        .map((x) => x.trip.destination.name)
        .join(", "),
      finalSelection: ownerInfo.trips
        .filter((x) => !x.deselected)
        .map((x) => x.trip.destination.name)
        .join(", "),
      finalDestination: selectedTrip.trip.destination.name,
      date: {
        arrival: {
          start: selectedTrip.arrivalTicket.date.start,
          end: selectedTrip.arrivalTicket.date.end,
        },
        departure: {
          start: selectedTrip.departureTicket.date.start,
          end: selectedTrip.departureTicket.date.end,
        },
      },
      quantity: ownerInfo.quantity,
      ticketPrice: selectedTrip.cost,
      deselectionPrice: deselectionPrice,
      totalPrice: finalCost,
    });

    await Ticket.findOneAndUpdate(
      {
        _id: selectedTrip.arrivalTicket._id,
        active: true,
        deleted: false,
        quantity: { $gte: ownerInfo.quantity },
      },
      {
        $inc: { soldTickets: ownerInfo.quantity },
      }
    );

    await Ticket.findOneAndUpdate(
      {
        _id: selectedTrip.departureTicket._id,
        active: true,
        deleted: false,
        quantity: { $gte: ownerInfo.quantity },
      },
      {
        $inc: { soldTickets: ownerInfo.quantity },
      }
    );

    await EmailService.clientOrder(order, charge.receipt_url);
    await EmailService.adminOrder(admin, order);

    ownerInfo.paid = true;
    ownerInfo.save({});

    return {
      name: selectedTrip.trip.destination.name,
      photo: this.readCityPhoto(selectedTrip.trip.destination),
      email: buyerInfo.email,
      arrivalTicket: {
        _id: selectedTrip.arrivalTicket._id,
        date: selectedTrip.arrivalTicket.date,
        type: selectedTrip.arrivalTicket.type,
      },
      departureTicket: {
        _id: selectedTrip.arrivalTicket._id,
        date: selectedTrip.departureTicket.date,
        type: selectedTrip.departureTicket.type,
      },
      finalCost,
      chargeId: charge.id,
    };

    async function populateTrips(trips) {
      for (let selectedTrip of trips) {
        selectedTrip.trip = await Trip.findById(selectedTrip.trip);
        selectedTrip.arrivalTicket = await Ticket.findById(
          selectedTrip.arrivalTicket
        );
        selectedTrip.departureTicket = await Ticket.findById(
          selectedTrip.departureTicket
        );
      }

      return trips;
    }

    function getMostExpensiveTrip({ quantity, trips }) {
      const selectedTrips = trips.filter((x) => {
        if (x.arrivalTicket || x.departureTicket) {
          return (
            !x.deselected &&
            !x.trip.fake &&
            x.arrivalTicket.quantity - x.arrivalTicket.soldTickets >= quantity
          );
        } else {
          return (
            !x.deselected &&
            !x.trip.fake &&
            x.arrivalTicket.quantity - x.arrivalTicket.soldTickets >=
              quantity &&
            x.departureTicket.quantity - x.departureTicket.soldTickets >=
              quantity
          );
        }
      });

      let mostExpensiveTrip;
      let vendorProfit = 0;
      for (let selectedTrip of selectedTrips) {
        let tripProfit =
          (selectedTrip.trip.adultPrice + selectedTrip.trip.childPrice) *
          quantity *
          0.1;
        if (tripProfit > vendorProfit) {
          mostExpensiveTrip = selectedTrip;
          vendorProfit = tripProfit;
        }
      }

      return mostExpensiveTrip;
    }

    function calculateDeselectionPrice(trips) {
      const deselectedTrips = trips.filter((x) => x.deselected);
      if (deselectedTrips.length > 0)
        return deselectedTrips.reduce((x, y) => x + y.trip.deselectionPrice, 0);

      return 0;
    }

    async function clearReservation(trip, owner) {
      TicketOwner.findOne({ owner }).then(async (ownerInfo) => {
        await Ticket.updateMany(
          { _id: { $in: [trip.arrivalTicket._id, trip.departureTicket._id] } },
          {
            $inc: { reservedQuantity: -ownerInfo.quantity },
            $pull: { blockedQuantity: { owner } },
          }
        );
        await RedisService.del(client1, `${owner}`);
      });
    }
  },

  async update(id, data) {
    if (data.trip) {
      const trip = await Trip.findOne({ _id: data.trip, deleted: false });
      if (!trip) throw { status: 404, message: "TRIP.NOT.EXIST" };
    }

    const ticket = await Ticket.findOne({ _id: id, deleted: false });
    if (!ticket) throw { status: 404, message: "TICKET.NOT.EXIST" };

    await Ticket.updateOne({ _id: id }, data);
    return Ticket.findById(id).populate("trip");
  },

  async findOne(id) {
    const ticket = await Ticket.findOne({ _id: id, deleted: false }).populate(
      "trip"
    );
    if (!ticket) throw { status: 404, message: "TICKET.NOT.EXIST" };

    return ticket;
  },

  departureBeforeDestination(
    departureTickets,
    destinationTickets,
    trip,
    quantity
  ) {
    let bool = false;
    let destinationCharges = 0;

    departureTickets.forEach((departure) => {
      // trip.tickets = [];
      destinationTickets.forEach((destination) => {
        if (
          departure.date.start.getTime() < destination.date.start.getTime() &&
          destination.quantity >=
            destination.soldTickets + destination.reservedQuantity + quantity
        ) {
          if (trip.tickets.indexOf(destination) < 0)
            trip.tickets.push(destination);
          destinationCharges = {
            adultPrice: destination.adultPrice,
            childPrice: destination.childPrice,
          };
          bool = true;
        }
      });
    });
    return { isValid: bool, destinationCharges: destinationCharges };
  },

  async hasOpposite(trip) {
    // const oppositeTrip = await Trip.findOne({destination: trip.departure, departure: trip.destination,
    //                   carrier: trip.carrier, type: trip.type}).sort({destination : 1})
    const oppositeTrip = await Trip.aggregate([
      {
        $match: {
          destination: trip.departure,
          departure: trip.destination,
          carrier: trip.carrier,
          type: trip.type,
        },
      },
      {
        $lookup: {
          from: "tickets",
          localField: "tickets",
          foreignField: "_id",
          as: "tickets_data",
        },
      },
    ]);
    if (oppositeTrip != undefined) return oppositeTrip;

    return null;
  },

  async getAllOppositeTrips(trips) {
    let match = { $or: [] };

    for (const trip of trips) {
      match.$or.push({
        destination: trip.departure,
        departure: trip.destination,
        carrier: trip.carrier,
        type: trip.type,
      });
    }

    const oppositeTrips = await Trip.aggregate([
      {
        $match: match,
      },
      {
        $lookup: {
          from: "tickets",
          localField: "tickets",
          foreignField: "_id",
          as: "tickets_data",
        },
      },
    ]);
    if (oppositeTrips != undefined) return oppositeTrips;

    return null;
  },

  async hasEnoughTickets(trip, oppositeTrips, quantity) {
    // const oppositeTrip = await this.hasOpposite(trip);
    const oppositeTrip = oppositeTrips.filter(
      (tr) =>
        JSON.stringify(tr.destination) === JSON.stringify(trip.departure) &&
        JSON.stringify(tr.departure) === JSON.stringify(trip.destination) &&
        JSON.stringify(tr.carrier) === JSON.stringify(trip.carrier) &&
        JSON.stringify(tr.type) === JSON.stringify(trip.type)
    );

    let oppositeTickets = [];
    let tripTickets = [];
    // for (const ticket of trip.tickets) {
    //   // tripTickets.push(await Ticket.findById({_id: ticket._id.toString()}).sort({_id : 1}))
    //   tripTickets.push(ticket)
    // }123

    tripTickets = trip.tickets;

    if (oppositeTrip != null) {
      if (oppositeTrip[0]) oppositeTickets = oppositeTrip[0].tickets_data;

      if (!(tripTickets.length && oppositeTickets.length)) {
        return { isValid: false };
      } else {
        const { isValid, destinationCharges } = this.departureBeforeDestination(
          tripTickets,
          oppositeTickets,
          trip,
          quantity
        );

        return { isValid: isValid, destinationCharges: destinationCharges };
      }
    } else {
      return { isValid: false };
    }
  },
  async findDashboard({
    page,
    limit,
    adult,
    youth,
    priceStart,
    priceEnd,
    dateStart,
    dateEnd,
    departure,
    timezone,
  }) {
    if (departure === "No_departure_found") {
      return [];
    }

    page = +page;
    limit = 1000;
    adult = +adult;
    youth = +youth;
    priceStart = +priceStart;
    priceEnd = +priceEnd;
    dateStart = +dateStart;
    dateEnd = +dateEnd;
    timezone = +timezone;

    const quantity = adult + youth;

    // Search trips & opposite trips in parallel
    let trips = await Trip.aggregate([
      {
        $match: {
          active: true,
          "departure.name": departure,
          "meta.availableQuantity": { $gte: quantity },
          "meta.availableTickets.0": { $exists: true },
        },
      },
      {
        $lookup: {
          from: "trips",
          let: {
            type: "$type",
            carrier: "$carrier",
            departure: "$departure",
            destination: "$destination",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$active", true] },
                    { $gte: ["$meta.availableQuantity", quantity] },
                    { $eq: ["$departure", "$$destination"] },
                    { $eq: ["$destination", "$$departure"] },
                    { $eq: ["$carrier", "$$carrier"] },
                    { $eq: ["$type", "$$type"] },
                  ],
                },
              },
            },
            {
              $match: { "meta.availableTickets.0": { $exists: true } },
            },
            { $project: { _id: 1, meta: 1 } },
            { $limit: 1 },
          ],
          as: "opposite",
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          photo: 1,
          adultPrice: 1,
          childPrice: 1,
          discount: 1,
          duration: 1,
          carrier: 1,
          type: 1,
          deselectionPrice: 1,
          departure: 1,
          destination: 1,
          meta: 1,
          opposite: 1,
        },
      },
      {
        $match: { "opposite.0": { $exists: true } },
      },
      {
        $limit: limit,
      },
    ]);

    // Filter trips with enough tickets
    trips = trips.map((obj) => {
      const { meta, opposite, ...trip } = obj;

      let oppositeTickets = [];
      let departureTickets = meta.availableTickets;
      let destinationTickets = opposite[0].meta.availableTickets;
      let destinationCharges = {
        adultPrice: 0,
        childPrice: 0,
      };
      // Add opposite trip tickets dated after any trip ticket
      departureTickets.forEach((departure) => {
        destinationTickets.forEach((destination) => {
          if (
            departure.date.start.getTime() < destination.date.start.getTime()
          ) {
            if (oppositeTickets.indexOf(destination) < 0) {
              oppositeTickets.push(destination);
            }
            destinationCharges = {
              adultPrice: destination.adultPrice,
              childPrice: destination.childPrice,
            };
          }
        });
      });

      if (oppositeTickets.length === 0){
        // No returning tickets available
        return false;
      }
      // Compute tickets array and append departure/destination
      // to distinguich between tickets and returning tickets
      let tickets = meta.availableTickets.map(t => ({
        ...t,
        departure: trip.departure.name,
        destination: trip.destination.name
      }));
      tickets = tickets.concat(oppositeTickets.map(t => ({
        ...t,
        departure: trip.destination.name,
        destination: trip.departure.name
      })))

      // Return trip search result
      return {
        ...trip,
        Adult: adult,
        Youth: youth,
        typeOfTransport: trip.type,
        destinationCharges,
        tickets
      };
    }).filter((trip) => trip);

    // Filter in price range
    if (priceEnd > 0) {
      trips = trips.filter((trip) =>
        this.isInPriceRange(trip, adult, youth, priceStart, priceEnd)
      );
    }

    // Alter destination photo
    trips = trips.map((trip) => {
      if (trip.destination && trip.destination.photo) {
        trip.destination.photo =
          "http://35.202.14.48/api/destinations/" +
          trip.destination.photo.replace("./", "");
      }
      return trip;
    });

    return trips;
  },

  isInPriceRange(trip, adult, youth, priceStart, priceEnd) {
    const totalPrice = 2 * (trip.adultPrice * adult + trip.childPrice * youth);
    return totalPrice <= priceEnd && totalPrice >= priceStart;
  },

  async findCRM({ dateStart, dateEnd, from, to, carrier, page, limit }) {
    dateStart = +dateStart;
    dateEnd = +dateEnd;
    page = +page;
    limit = +limit;

    const fromArray = from.split(",");
    const toArray = to.split(",");
    const carrierArray = carrier.split(",");

    let pipeline = [
      {
        $facet: {
          results: [
            {
              $match: {
                active: true,
                deleted: false,
                "date.start": { $gte: new Date(dateStart) },
              },
            },
            { $sort: { "date.start": 1 } },
            ...Aggregate.skipAndLimit(page, limit),
          ],
        },
      },
    ];

    let pipeline2 = [
      {
        $facet: {
          results: [
            {
              $match: {
                deleted: false,
                "date.start": { $gte: new Date(dateStart) },
              },
            },
            { $sort: { "date.start": 1 } },
          ],
        },
      },
    ];

    if (dateEnd !== 0) {
      pipeline.unshift({
        $match: {
          "date.start": { $gte: new Date(dateStart), $lte: new Date(dateEnd) },
        },
      });
      pipeline2.unshift({
        $match: {
          "date.start": { $gte: new Date(dateStart), $lte: new Date(dateEnd) },
        },
      });
    }
    if (from !== "null") {
      pipeline.unshift({ $match: { departure: { $in: fromArray } } });
      pipeline2.unshift({ $match: { departure: { $in: fromArray } } });
    }
    if (to !== "null") {
      pipeline.unshift({ $match: { destination: { $in: toArray } } });
      pipeline2.unshift({ $match: { destination: { $in: toArray } } });
    }
    if (carrier !== "null") {
      pipeline.unshift({ $match: { carrier: { $in: carrierArray } } });
      pipeline2.unshift({ $match: { carrier: { $in: carrierArray } } });
    }

    const ticketsTotal = await Ticket.aggregate(pipeline2);

    return Ticket.aggregate(pipeline).then((data) => {
      data[0].total = [];
      data[0].total.push(ticketsTotal[0].results.length);
      data[0].total.push(data[0].results);
      return data[0].total;
    });
  },

  async getQuantity() {
    return await Ticket.find({ deleted: false }).estimatedDocumentCount();
  },

  async destroy(id) {
    const ticket = await Ticket.findById(id);
    if (!ticket) throw { status: 404, message: "TICKET.NOT.EXIST" };

    if (ticket.blockedQuantity.length > 0) {
      await Ticket.updateOne(
        {
          _id: id,
        },
        {
          quantity: 0,
          deleted: true,
        }
      );
    } else {
      await Ticket.findByIdAndDelete(id);
      const trip = await Trip.findOneAndUpdate(
        { _id: ticket.trip },
        { $pull: { tickets: id } },
        { new: true }
      );

      if (trip.deleted && !trip.tickets.length)
        await Trip.deleteOne({ _id: ticket.trip });
    }

    return;
  },

  async getTickets(page, limit, date) {
    return await Ticket.aggregate([
      {
        $facet: {
          results: [
            {
              $match: {
                deleted: false,
                "date.start": { $gte: new Date(date) },
              },
            },
            ...Aggregate.skipAndLimit(page, limit),
          ],
          status: Aggregate.getStatusWithSimpleMatch({}, page, limit),
        },
      },
    ]).then(Aggregate.parseResults);
  },

  readCityPhoto(city) {
    let value = "";
    try {
      value = photoPrefix + fs.readFileSync(city.photo, BASE_64_PHOTO_ENCODING);
    } catch (err) {
      const country = city.country.replace(" ", "_");
      const name = city.name.replace(" ", "_");

      const photoDirPath = PHOTO_DIR_PATH + country + "/";
      const photoPath = photoDirPath + name + ".png";

      if (!fs.existsSync(PHOTO_DIR_PATH)) {
        fs.mkdirSync(PHOTO_DIR_PATH);
        fs.chmodSync(PHOTO_DIR_PATH, "777");
      }

      if (!fs.existsSync(photoDirPath)) {
        fs.mkdirSync(photoDirPath);
        fs.chmodSync(photoDirPath, "777");
      }

      fs.writeFileSync(photoPath, DEFAULT_PHOTO, {
        encoding: BASE_64_PHOTO_ENCODING,
      });
      fs.chmodSync(photoPath, "777");
      value = photoPrefix + DEFAULT_PHOTO;
    }

    return value;
  },
};
