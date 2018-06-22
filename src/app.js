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
const {
  getItems, addItem
} = require('./controllers/items');
const {
  getUserRankings, setUserRanking, getTopRankings, createUsers, clearUserRankings,
  deleteUserRanking
} = require('./controllers/rankings');
const { graphql, graphiql } = require('./controllers/graphql');

const app    = new Koa();
const router = new Router();

router
  .get('/', (ctx, next) => {
    ctx.body = 'Hello World';
  })
  .get('/handle_google_callback', (ctx, next) => {
    ctx.assert(ctx.session.grant.response.raw, 401, 'Auth Failed')
    ctx.cookies.set('id_token', ctx.session.grant.response.raw.id_token);
    ctx.redirect(ctx.cookies.get('after_login'));
  })
  .get('*/ping', (ctx, next) => {
    ctx.body = `pong ${new Date().toString()}`;
  })
  .use(auth)
  .get('*/protected', async (ctx, next) => {
    ctx.body = `Protected`;
  })
  .get('*/items', getItems)
  .post('*/item', addItem)
  .get('*/graphql', graphql)
  .post('*/graphql', graphql)
  .get('*/graphiql', graphiql)
  .get('*/user_ranking', getUserRankings)
  .post('*/user_ranking', setUserRanking)
  .del('*/user_ranking', deleteUserRanking)
  .del('*/all_user_rankings', clearUserRankings)
  .get('*/top_rankings', getTopRankings)
  .get('*/buildusers', createUsers)

app.keys = ['grant'];
app.use(db(app));
app.use(logger());
app.use(bodyParser());
app.use(session(app));
app.use(mount(grant(config[process.env.NODE_ENV || 'development'])));
app.use(router.routes());
app.use(router.allowedMethods());

const port = process.env.PORT || 4000;
console.log(`Listening on port ${port}.`);
app.listen(port);
