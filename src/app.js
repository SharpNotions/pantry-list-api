const Koa        = require('koa');
const Router     = require('koa-router');
const logger     = require('koa-logger');
const bodyParser = require('koa-bodyparser');
const auth       = require('./auth');
const R          = require('ramda');
const db         = require('./db/db-middleware');
const itemsController = require('./controllers/items');
const { graphql, graphiql } = require('./controllers/graphql');

const app    = new Koa();
const router = new Router();

router
  .get('/', (ctx, next) => {
    ctx.body = 'Hello World';
  })
  .get('*/ping', (ctx, next) => {
    ctx.body = `pong ${new Date().toString()}`;
  })
  .use(auth)
  .get('*/protected', async (ctx, next) => {
    ctx.body = `Protected`;
  })
  .get('*/items', itemsController.getItems)
  .post('*/item', itemsController.addItem)
  .get('*/graphql', graphql)
  .post('*/graphql', graphql)
  .get('/graphiql', graphiql)

app.use(db(app));
app.use(logger());
app.use(bodyParser());
app.use(router.routes());
app.use(router.allowedMethods());

const port = process.env.PORT || 4000;
console.log(`Listening on port ${port}.`);
app.listen(port);
