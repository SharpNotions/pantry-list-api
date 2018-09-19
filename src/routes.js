const Router              = require('koa-router');
const {graphql, graphiql} = require('./controllers/graphql');
const auth                = require('./auth');
const {
  getUnrankedItems, addItem
} = require('./controllers/items');
const {
  getUserRankings, setUserRanking, getTopRankings, clearUserRankings,
  deleteUserRanking,
  getAllUserRankings
} = require('./controllers/rankings');

const router = new Router()

router
  .get('/', async (ctx, next) => {
    ctx.body = 'Hello World'
    await next()
  })
  .get('/handle_google_callback', async (ctx, next) => {
    ctx.assert(ctx.session.grant.response.raw, 401, 'Auth Failed')
    ctx.cookies.set('id_token', ctx.session.grant.response.raw.id_token)
    ctx.redirect(ctx.cookies.get('after_login'))
    await next()
  })
  .get('*/ping', async (ctx, next) => {
    ctx.body = `pong ${new Date().toString()}`;
    await next()
  })
  // .use(auth)
  .get('*/protected', async (ctx, next) => {
    ctx.body = `Protected`;
    await next()
  })
  .get('*/unranked_items', getUnrankedItems)
  .post('*/item', addItem)
  .get('*/graphql', graphql)
  .post('*/graphql', graphql)
  .get('*/graphiql', graphiql)
  .get('*/user_ranking', getUserRankings)
  .post('*/user_ranking', setUserRanking)
  .del('*/user_ranking', deleteUserRanking)
  .get('*/all_user_rankings', getAllUserRankings)
  .del('*/all_user_rankings', clearUserRankings)
  .get('*/top_rankings', getTopRankings)

module.exports = router
