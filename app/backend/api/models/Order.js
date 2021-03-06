'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = new Schema({
  buyer: {
    name: String,
    email: String,
    phone: String,
    birthDate: Date,
    address: String,
    city: String,
    zipCode: String,
  },
  stripeChargeId: String,
  selected: [{
    name: String,
    price: Number,
    date: {
      arrival: {
        start: Date,
        end: Date
      },
      departure: {
        start: Date,
        end: Date
      },
    }
  }],
  deselected: String,
  finalSelection: String,
  finalDestination: String,
  date: {
    arrival: {
      start: Date,
      end: Date
    },
    departure: {
      start: Date,
      end: Date
    },
  },
  quantity: Number,
  ticketPrice: Number,
  arrivalTimePrice: Number,
  departureTimePrice: Number,
  deselectionPrice: Number,
  totalPrice: Number,
  sent: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Order', orderSchema);
