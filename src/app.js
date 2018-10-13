const Koa        = require('koa');
const Router     = require('koa-router');
const logger     = require('koa-logger');
const bodyParser = require('koa-bodyparser');
const auth       = require('./auth');
const R          = require('ramda');
const db         = require('./db/db-middleware');
const router     = require('./routes');
const {
  getUnrankedItems, addItem
} = require('./controllers/items');
const {
  getUserRankings, setUserRanking, getTopRankings, createUsers, clearUserRankings,
  deleteUserRanking
} = require('./controllers/rankings');
const { graphql, graphiql } = require('./controllers/graphql');

const app = new Koa();
R.forEach(middleware => app.use(middleware), [
  db(app),
  logger(),
  bodyParser(),
  router.routes(),
  router.allowedMethods()
])

const port = process.env.PORT || 4000;
console.log(`Listening on port ${port}.`);
app.listen(port);
