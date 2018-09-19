const Koa        = require('koa');
const Router     = require('koa-router');
const logger     = require('koa-logger');
const bodyParser = require('koa-bodyparser');
const mount      = require('koa-mount')
const grant      = require('grant-koa')
const session    = require('koa-session')
const auth       = require('./auth');
const R          = require('ramda');
const db         = require('./db/db-middleware');
const config     = require('./config');
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
app.keys = ['grant'];
R.forEach(middleware => app.use(middleware), [
  db(app),
  logger(),
  bodyParser(),
  session(app),
  mount(grant(config[process.env.NODE_ENV || 'development'])),
  router.routes(),
  router.allowedMethods()
])

const port = process.env.PORT || 4000;
console.log(`Listening on port ${port}.`);
app.listen(port);
