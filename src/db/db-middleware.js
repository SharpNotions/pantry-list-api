const db = require('./connection');
const { Model } = require('objection');
const models = require('../models')

module.exports = (app) => {
  Model.knex(db);
  app.models = models;
  return function (ctx, next) {
    return next()
  }

}
