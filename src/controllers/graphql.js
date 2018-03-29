const { graphqlKoa, graphiqlKoa } = require('apollo-server-koa');
const { builder } = require('objection-graphql');
const Item = require('../models/Item');
const UserRanking = require('../models/UserRanking')
const schema = builder()
  .model(Item, {listFieldName: 'items', fieldName: 'item'})
  .model(UserRanking, {listFieldName: 'userRankings', fieldName: 'userRanking'})
  .build();

exports.graphql = graphqlKoa({ schema })
exports.graphiql = graphiqlKoa({ endpointURL: '/graphql' })
