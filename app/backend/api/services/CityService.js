'use strict';

const { City, Trip, Ticket } = require('../models');
const Aggregate = require('./Aggregate');
var ObjectId = require('mongoose').Types.ObjectId;
var fs = require('fs');
var NodeGeocoder = require('node-geocoder');

var options = {
  provider: 'google',

  // Optional depending on the providers
  httpAdapter: 'https', // Default
  apiKey: 'AIzaSyCOvJSJiJaKykPQ0dfzYWO1OVRBNlnN8FU', // for Mapquest, OpenCage, Google Premier
  formatter: null // 'gpx', 'string', ...
};

var geocoder = NodeGeocoder(options);

const PHOTO_DIR_PATH = './city_photos/';
const BASE_64_PHOTO_ENCODING = 'Base64';
const photoPrefix = 'data:image/png;base64,';
const DEFAULT_PHOTO =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

module.exports = {
  async create(data) {
    const city = await City.findOne({ name: data.name });
    if (city) throw { status: 409, message: 'CITY.EXIST' };

    const indexOfData = data.photo.indexOf(',') + 1;
    const photo = data.photo.substring(indexOfData);

    const country = data.country.replace(' ', '_');
    const name = data.name.replace(' ', '_');

    const photoDirPath = PHOTO_DIR_PATH + country + '/';
    const photoPath = photoDirPath + name + '.png';

    if (!fs.existsSync(PHOTO_DIR_PATH)) {
      fs.mkdirSync(PHOTO_DIR_PATH);
      fs.chmodSync(PHOTO_DIR_PATH, '777');
    }

    if (!fs.existsSync(photoDirPath)) {
      fs.mkdirSync(photoDirPath);
      fs.chmodSync(photoDirPath, '777');
    }

    fs.writeFile(
      photoPath,
      photo,
      { encoding: BASE_64_PHOTO_ENCODING },
      err => {
        if (err) {
          console.error(err);
        } else {
          fs.chmodSync(photoPath, '777');
          console.log('photo saving successful');
        }
      }
    );

    data.photo = photoPath;

    geocoder
      .geocode(`${data.name} ${data.country}`)
      .then(res => {
        data.latitude = res[0].latitude;
        data.longitude = res[0].longitude;
        return City.create(data);
      })
      .catch(err => {
        console.log(err);
        return City.create(data);
      });
  },

  async findCRM(page, limit, sortOrder, sortField) {
    if (sortOrder == undefined) {
      sortOrder = 'ascending';
    }
    const query = {
      page: ~~Number(page),
      limit: ~~Number(limit),
      sortOrder: 'ascending' === sortOrder ? 1 : -1,
      sortField: sortField
    };

    let cities = await City.aggregate([
      {
        $facet: {
          results: [
            { $sort: (sortField) ? { [query.sortField]: query.sortOrder } : { country: 1, name: 1 } },
            ...Aggregate.skipAndLimit(query.page, query.limit)
          ],
          status: Aggregate.getStatusWithSimpleMatch(
            {},
            query.page,
            query.limit
          )
        }
      }
    ]).then(Aggregate.parseResults);

    cities.results = cities.results.map(city => {
      if (city.photo) {
        city.photo = this.readCityPhoto(city);
      }
      return city;
    });
    return cities;
  },

  async findOne(id) {
    let city = await City.findOne({ _id: id });
    if (!city) throw { status: 404, message: 'CITY.NOT.EXIST' };

    if (city.photo) {
      const value =
        photoPrefix + fs.readFileSync(city.photo, BASE_64_PHOTO_ENCODING);
      city.photo = value;
    }
    return city;
  },

  async findCity(name, page, limit) {
    let city = City.aggregate([
      {
        $facet: {
          results: [
            { $match: { name: name } },
            ...Aggregate.skipAndLimit(page, limit)
          ],
          status: Aggregate.getStatusWithSimpleMatch(
            { name: name },
            page,
            limit
          )
        }
      }
    ]).then(Aggregate.parseResults);

    return city;
  },

  async update(id, data) {
    let city = await City.findOne({ _id: id });
    const oldName = city.name;
    if (!city) throw { status: 404, message: 'CITY.NOT.EXIST' };

    if (data.name) {
      city = await City.findOne({ name: data.name });
      if (city) throw { status: 409, message: 'CITY.NAME.EXIST' };
    }

    if (data.photo) {
      const indexOfData = data.photo.indexOf(',') + 1;
      const photo = data.photo.substring(indexOfData);

      fs.writeFile(
        city.photo,
        photo,
        { encoding: BASE_64_PHOTO_ENCODING },
        err => {
          if (err) {
            console.error(err);
          } else {
            fs.chmodSync(city.photo, '777');
            console.log('photo editing successful');
          }
        }
      );

      data.photo = city.photo;
    }

    data.isDestination = city.isDestination;
    data.isDeparture = city.isDeparture;

    const updatedCity = await City.findByIdAndUpdate(id, data, { new: true });

    const departureTrips = await Trip.find({ 'departure._id': ObjectId(id) });
    departureTrips.length &&
      departureTrips.forEach(async trip => {
        await Trip.findByIdAndUpdate(
          trip._id,
          {
            $set: {
              'departure.name': updatedCity.name,
              'departure.photo': updatedCity.photo,
              'departure.isEnabled': updatedCity.isEnabled,
              'departure.isDeparture': updatedCity.isDeparture,
              'departure.tags': updatedCity.tags,
              'departure.country': updatedCity.country,
              'departure.isManual': updatedCity.isManual
            }
          },
          { new: true }
        );
      });

    const destinationTrips = await Trip.find({
      'destination._id': ObjectId(id)
    });
    destinationTrips.length &&
      destinationTrips.forEach(async trip => {
        await Trip.findByIdAndUpdate(
          trip._id,
          {
            $set: {
              'destination.name': updatedCity.name,
              'destination.photo': updatedCity.photo,
              'destination.isEnabled': updatedCity.isEnabled,
              'destination.tags': updatedCity.tags,
              'destination.country': updatedCity.country,
              'destination.isManual': updatedCity.isManual,
              'destination.isDestination': updatedCity.isDestination
            }
          },
          { new: true }
        );
      });

    const allTrips = [...departureTrips, ...destinationTrips];

    data.name &&
      allTrips.length &&
      allTrips.forEach(async trip => {
        trip.tickets.forEach(async ticketId => {
          const ticket = await Ticket.findOne({ _id: ObjectId(ticketId) });

          if (ticket && ticket.departure === oldName) {
            await Ticket.updateOne(
              { _id: ObjectId(ticketId) },
              { departure: data.name }
            );
          } else if (ticket && ticket.destination === oldName) {
            await Ticket.updateOne(
              { _id: ObjectId(ticketId) },
              { destination: data.name }
            );
          }
        });
      });

    return updatedCity;
  },

  async destroy(id) {
    const city = await City.findById(id);
    if (!city) throw { status: 404, message: 'CITY.NOT.EXIST' };

    await Trip.updateMany(
      { 'destination._id': id },
      { $set: { active: false } }
    );
    await Trip.updateMany({ 'departure._id': id }, { $set: { active: false } });
    await City.findByIdAndDelete(id);

    return;
  },

  async updateOne(id, data) {
    const { isDeparture, isDestination } = data;
    let city = await City.findByIdAndUpdate(id, data, { new: true });

    if (isDestination !== undefined) {
      // Toggle active for all trips
      let [res1, res2] = [await Trip.updateMany(
        { 'destination._id': ObjectId(id) },
        { $set: { 'destination.isDestination': isDestination } }
      ), await Trip.updateMany(
        { 'destination._id': ObjectId(id), 'departure.isDeparture': true },
        { $set: { active: isDestination } }
      )];

      // console.log(">>>>>>>>>>> trips", res1 , '>> ', res2)

      // Toggle active for all ticket trips
      const destinationTrips = await Trip.find({
        'destination._id': ObjectId(id)
      });

      destinationTrips.forEach(async trip => {
        let res3 = await Ticket.updateMany({
          trip: ObjectId(trip._id)
        }, {
          $set: { active: trip.active }
        });
        // console.log(">>>>>>>>>>> tickets ", res3)
      });
    }

    if (isDeparture !== undefined) {
      // Toggle active for all trips
      let [res1, res2] = [await Trip.updateMany(
        { 'departure._id': ObjectId(id) },
        { $set: { 'departure.isDeparture': isDeparture } }
      ), await Trip.updateMany(
        { 'departure._id': ObjectId(id), 'destination.isDestination': true },
        { $set: { active: isDeparture } }
      )];

      // console.log(">>>>>>>>>>>", res1, res2)

      const departureTrips = await Trip.find({ 'departure._id': ObjectId(id) });
      departureTrips.forEach(async trip => {
        let res3 = await Ticket.updateMany({
          trip: ObjectId(trip._id)
        }, {
          $set: { active: trip.active }
        });
        // console.log(">>>>>>>>>>", res3)
      });
    }

    const value =
      photoPrefix + fs.readFileSync(city.photo, BASE_64_PHOTO_ENCODING);
    city.photo = value;
    return city;
  },

  readCityPhoto(city) {
    let value = '';
    try {
      value = photoPrefix + fs.readFileSync(city.photo, BASE_64_PHOTO_ENCODING);
    } catch (err) {
      const country = city.country.replace(' ', '_');
      const name = city.name.replace(' ', '_');

      const photoDirPath = PHOTO_DIR_PATH + country + '/';
      const photoPath = photoDirPath + name + '.png';

      if (!fs.existsSync(PHOTO_DIR_PATH)) {
        fs.mkdirSync(PHOTO_DIR_PATH);
        fs.chmodSync(PHOTO_DIR_PATH, '777');
      }

      if (!fs.existsSync(photoDirPath)) {
        fs.mkdirSync(photoDirPath);
        fs.chmodSync(photoDirPath, '777');
      }

      fs.writeFileSync(photoPath, DEFAULT_PHOTO, {
        encoding: BASE_64_PHOTO_ENCODING
      });
      fs.chmodSync(photoPath, '777');
      value = photoPrefix + DEFAULT_PHOTO;
    }

    return value;
  },

  async getListOfCitiesNames() {
    const names = await City.find({ isEnabled: true }).select('name');

    return names;
  }
};
