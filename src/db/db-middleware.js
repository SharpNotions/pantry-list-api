const db = require('./connection');
const objection = require('objection');
const models = require('../models')

class SoftDeleteQueryBuilder extends objection.QueryBuilder {
  constructor(modelClass) {
    super(modelClass)

    this.onBuild(query => {
      if (query.isFind() && !query.context().includeDeleted) {
        query.whereNull(`${modelClass.tableName}.deleted_at`);
      }
    });
  }

  includeDeleted() {
    return this.context({
      includeDeleted: true
    });
  }

  delete(...args) {
    return super.patch({ deleted_at: new Date() });
  }

  forceDelete(...args) {
    return super.delete(...args);
  }
}

module.exports = (app) => {
  objection.QueryBuilder = SoftDeleteQueryBuilder;
  objection.Model.QueryBuilder = SoftDeleteQueryBuilder;
  objection.Model.RelatedQueryBuilder = SoftDeleteQueryBuilder;

  objection.Model.knex(db);
  app.models = models;

  return (ctx, next) => next();
}
