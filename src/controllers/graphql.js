const { graphqlKoa, graphiqlKoa } = require('apollo-server-koa');
const { builder } = require('objection-graphql');
const Item = require('../models/Item');
const User = require('../models/User');
const UserRanking = require('../models/UserRanking')
const List = require('../models/List')
const schema = builder()
  .model(User, {listFieldName: 'users', fieldName: 'user'})
  .model(Item, {listFieldName: 'items', fieldName: 'item'})
  .model(UserRanking, {listFieldName: 'userRankings', fieldName: 'userRanking'})
  .model(List, {listFieldName: 'lists', fieldName: 'list'})
  .build();

exports.schema = schema
exports.graphql = graphqlKoa({ schema })
exports.graphiql = graphiqlKoa({ endpointURL: '/graphql' })
