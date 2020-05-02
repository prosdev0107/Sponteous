"use strict";

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Trip = require("./Trip");

const ticketSchema = new Schema({
  trip: { type: Schema.Types.ObjectId, ref: "Trip" },
  quantity: Number,
  soldTickets: Number,
  reservedQuantity: Number,
  departure: String,
  destination: String,
  adultPrice: Number,
  childPrice: Number,
  carrier: String,
  type: { type: String, enum: global.config.custom.ticket.type },
  date: {
    start: Date,
    end: Date,
  },
  active: { type: Boolean, default: true },
  deleted: { type: Boolean, default: false },
  blockedQuantity: [
    {
      owner: String, // Hash
      quantity: Number,
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

ticketSchema.statics.refreshTripMeta = async function (ticket) {
  // this is fired after a document was saved
  let [totalTrip] = await Ticket.aggregate([
    {
      $match: {
        active: true,
        deleted: false,
        trip: mongoose.Types.ObjectId(ticket.trip),
        "date.start": { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
      },
    },
    {
      $group: {
        _id: "$trip",
        totalQuantity: { $sum: "$quantity" },
        soldTickets: { $sum: "$soldTickets" },
        reservedQuantity: { $sum: "$reservedQuantity" },
        availableTickets: {
          $push: {
            date: { start: "$date.start", end: "$date.end" },
            type: "$type",
            adultPrice: "$adultPrice",
            childPrice: "$childPrice",
          },
        },
      },
    },
    { $limit: 1 },
  ]);
  //console.log('>>>>>>>>>>>>> available tickets', totalTrip)
  let trip = await Trip.updateOne(
    { _id: mongoose.Types.ObjectId(ticket.trip) },
    {
      meta: {
        totalQuantity: totalTrip ? totalTrip.totalQuantity : 0,
        availableQuantity: totalTrip
          ? totalTrip.totalQuantity -
            (totalTrip.soldTickets + totalTrip.reservedQuantity)
          : 0,
        availableTickets: totalTrip ? totalTrip.availableTickets : [],
      },
    }
  );
};

ticketSchema.post("save", function () {
  Ticket.refreshTripMeta(this);
});

ticketSchema.post("updateOne", async function (result) {
  let ticketId = this.getQuery()._id;
  let ticket = await Ticket.findOne({ _id: mongoose.Types.ObjectId(ticketId) });
  await Ticket.refreshTripMeta(ticket);
});

ticketSchema.post("deleteOne", async function (result) {
  let ticketId = this.getQuery()._id;
  let ticket = await Ticket.findOne({ _id: mongoose.Types.ObjectId(ticketId) });
  await Ticket.refreshTripMeta(ticket);
});

const Ticket = mongoose.model("Ticket", ticketSchema);

module.exports = Ticket;
