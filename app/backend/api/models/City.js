'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const citySchema = new Schema({
  name: String,
  country: String,
  photo: String,
  tags: [String],
  isManual: { type: Boolean, default: false },
  isEnabled: { type: Boolean, default: false },
  isDestination: { type: Boolean, default: true },
  isDeparture: { type: Boolean, default: true },
  latitude: String,
  longitude: String
});

module.exports = mongoose.model('City', citySchema);