'use strict';

const { TripService } = require('../../services');

module.exports = app => {
  app.get('/tripDeparturenames', ({ token: { role } }, res) => {
    if(role === global.config.custom.roles.GUEST) return res.error({ status: 403, message: 'ACCESS.DENIED' });

    TripService.getListOfDepartureNames()
      .then(res.ok)
      .catch(res.error);
  });
};