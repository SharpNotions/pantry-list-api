const db = require('./connection')
const objection = require('objection')
const objectionSoftDelete = require('objection-softdelete')
const models = require('../models')

module.exports = (app) => {
  objection.Model.knex(db);
  objectionSoftDelete.register(objection, {
    deleteAttr: 'deleted_at'
  });
  app.models = models;

  return (ctx, next) => next();
}
