const db = require('./connection')
const objection = require('objection')
const models = require('../models')

module.exports = (app) => {
  objection.Model.knex(db);
  app.models = models;

  return (ctx, next) => next();
}
