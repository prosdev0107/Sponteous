'use strict';

const { UserService } = require('../../services');

module.exports = app => {
  app.post('/user/changePassword', ({ body, token: { role }}, res) => {
    UserService.changePassword(body.user, body.oldPassword, body.newPassword)
      .then(res.ok)
      .catch(res.error);
  });
}