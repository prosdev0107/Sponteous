'use strict';
const Aggregate = require('./Aggregate');
const Models = require('../models');
const { User } = Models;
const EmailService = require('./EmailService');
const jwToken = require('../services/jwToken');
const faker = require('faker');


module.exports = {
  async login ({ email, password }) {

    try {

    const user = await User.findOne({ email });
    if (!user) throw { status: 404, message : 'USER.EMAIL.NOT_FOUND' };

    if(user.isDeleted || !user.active) {

      throw {status: 404, message : 'USER.NOT.AUTHORIZED'}
    } 
    await User.comparePassword(password, user);

    return {
      token: jwToken.issue({
        id: user._id,
        role: user.role
      }),
      user: user
    };

    } catch(err) {

      throw err;

    }

  },
  async changePassword(data, oldPassword, newPassword) {
    try {
      const user = await User.findOne({ email: data.email });
      if(!user) throw { status: 404, message: 'USER.EMAIL.NOT_FOUND'};

      if(user.isDeleted || !user.active) {
        throw { status: 404, message: 'USER.NOT.AUTHORIZED'}
      }
      await User.comparePassword(oldPassword, user);
      
      data.password = await User.createPasswordHash(newPassword);
      await User.findByIdAndUpdate(data._id, data, { new:true });

      return {
        success: true
      }
    } catch(err) {
      throw err
    }
  },
  async create (data) {

    try {
      const user = await User.findOne({ email: data.email});
    
      if(user) throw { status: 409, message: 'USER.EXIST' };
    
      data.password = faker.internet.password(6); // à remplacer par des vrais passwords dans add new users
    
    
      await User.create(data);
      await EmailService.AddingNotif(data.name, data.email, data.password); //  remplacer par data dans les paramètres et déstructurer la methode signature
    } catch(err) {
      throw err;
    }

    
  },
  async findOne (id) {

    try {

      const user = await User.findOne({ _id: id }) ;
      if(!user) throw { status: 404, message: 'USER.NOT.EXIST' };
      
      return user;

    } catch(err) {
      
      throw err;
    }

  },

  async getListOfUsers () {

    try {
      const users = await User.find({ isDeleted: {$all: false}}).select('name email role active ');

      return users;
    } catch (err) {
      
      throw err;
    }

  },

  async findCRM (page, limit) {
    return User.aggregate([
      {
        $facet: {
          results: [
            { $match: { isDeleted: false } },
            { $sort: { name: 1, email: 1 } },
            ...Aggregate.skipAndLimit(page, limit)
          ],
          status: Aggregate.getStatusWithSimpleMatch(
            {},
            page,
            limit
          )
        }
      }
    ]).then(Aggregate.parseResults);
  },
  
  async update (id, data) {
    let user = await User.findOne({ _id: id });
    if(!user) throw { status: 404, message: 'USER.NOT.EXIST' };

    if(data.email) {
      user = await User.findOne({ email: data.email});
      if(user) throw { status: 409, message: 'USER.EMAIL.EXIST' };
    }

    return User.findByIdAndUpdate(id, data, { new: true });
},
  
  async updateOne (id, data) {
  return User.findByIdAndUpdate(id, data, { new: true });
},

  async destroy (id) {
    const user = await User.findById(id);
    if(!user) throw { status: 404, message: 'USER.NOT.EXIST' };
      
    await User.findByIdAndDelete(id);
    
    return;
  },

};
