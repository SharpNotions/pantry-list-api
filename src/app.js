const Koa        = require('koa');
const Router     = require('koa-router');
const logger     = require('koa-logger');
const bodyParser = require('koa-bodyparser');

const app    = new Koa();
const router = new Router();

router
  .get('/', (ctx, next) => {
    ctx.body = 'Hello World';
  })
  .get('/ping', (ctx, next) => {
    ctx.body = `pong ${new Date().toString()}`;
  });

app.use(logger());
app.use(bodyParser());
app.use(router.routes());
app.use(router.allowedMethods());

const port = process.env.PORT || 4000;
console.log(`Listening on port ${port}.`);
app.listen(port);
