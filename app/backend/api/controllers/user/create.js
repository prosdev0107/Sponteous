'use strict';

const { Valid, UserService } = require('../../services');

module.exports = app => {
  app.post('/user', ({ body, token: { role } }, res) => {
    if(role !== global.config.custom.roles.ADMINISTRATOR) return res.error({ status: 403, message: 'ACCESS.DENIED' });
    Valid.onCreate(body, 'User', role)
      .then(data => UserService.create(data))
      .then(res.created)
      .catch(res.error)
    }
  );
};
