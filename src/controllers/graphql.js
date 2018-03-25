const { graphqlKoa, graphiqlKoa } = require('apollo-server-koa');
const { builder } = require('objection-graphql');
const Item = require('../models/Item');
const schema = builder().model(Item).build();

exports.graphql = graphqlKoa({ schema })
exports.graphiql = graphiqlKoa({ endpointURL: '/graphql' })
