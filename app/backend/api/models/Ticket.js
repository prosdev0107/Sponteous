'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Trip = require("./Trip");


const ticketSchema = new Schema({
  trip: { type: Schema.Types.ObjectId, ref: 'Trip' },
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
    end: Date
  },
  active: { type: Boolean, default: true },
  deleted: { type: Boolean, default: false },
  blockedQuantity: [{
    owner: String, // Hash
    quantity: Number
  }],
  createdAt: { type: Date, default: Date.now }

});

ticketSchema.post('updateOne', async function (result) {
  let ticketId = this.getQuery()._id;
  let ticket = await Ticket.findOne({_id: mongoose.Types.ObjectId(ticketId)});
  // this is fired after a document was saved
  let [totalTrip] = await Ticket.aggregate([
    {
      $match: {
        active: true,
        deleted: false,
        trip: mongoose.Types.ObjectId(ticket.trip)
      }
    },
    {
      $group: {
        _id: "$trip",
        totalQuantity: { $sum: "$quantity"},
        soldTickets: { $sum: "$soldTickets"},
        reservedQuantity: { $sum: "$reservedQuantity"}
      }
    },
    { $limit: 1 }
  ]);
  let trip = await Trip.updateOne({_id: mongoose.Types.ObjectId(ticket.trip)}, {
    meta: {
      totalQuantity: totalTrip.totalQuantity,
      availableQuantity: totalTrip.totalQuantity - (totalTrip.soldTickets + totalTrip.reservedQuantity)
    }
  });
});

const Ticket = mongoose.model('Ticket', ticketSchema);

module.exports = Ticket;
