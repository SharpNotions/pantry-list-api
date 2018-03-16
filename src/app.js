const Koa = require('koa');
const Router = require('koa-router');
const logger = require('koa-logger');
const bodyParser = require('koa-bodyparser');

const app = new Koa();
const router = new Router();

router
  .get('/', (ctx, next) => {
    ctx.body = 'Hello World';
  })
  .get('/ping', (ctx, next) => {
    ctx.body = 'pong';
  });

app.use(logger());
app.use(router.routes());
app.use(router.allowedMethods());

app.listen(4000);
