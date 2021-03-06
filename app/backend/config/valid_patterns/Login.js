'use strict';

const ROLE = global.config.custom.roles;

module.exports = {
  login: {
    email: {
      type: 'email',
      required: true,
      permission: {
        create: [ROLE.GUEST],
        update: [],
        find: [],
        destroy: [],
      },
      minLength: 5,
      maxLength: 40,
      pattern: /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,10}))$/
    },

    password: {
      type: 'password',
      required: true,
      permission: {
        create: [ROLE.GUEST],
        update: [],
        find: [],
        destroy: [],
      }
    }
  }
};
