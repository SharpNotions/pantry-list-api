const objection = require('objection');
const models = require('../src/models')

exports.getDbModels = (connection) => {
  objection.Model.knex(connection);

  return models;
};
