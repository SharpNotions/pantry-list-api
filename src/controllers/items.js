const { transaction } = require('objection')
const fetch           = require('node-fetch')
const R               = require('ramda')
const establishList   = require('./helpers/establishList')

exports.addItem = establishList(list => async (ctx, next) => {
  const graph = ctx.request.body
  const Item = ctx.app.models.Item

  const insertedGraph = await transaction(Item.knex(), trx =>
    Item.query(trx).upsertGraph({
      ...graph,
      list
    }, {
      relate: true
    })
  )
  ctx.body = insertedGraph
  fetch('https://pantry-list-slack-bot.now.sh/item-added', {
    method: 'POST',
    body: JSON.stringify({ item_name: graph.item_name })
  })

  await next()
});

exports.getUnrankedItems = establishList(list => async (ctx, next) => {
  const {
    Item, UserRanking
  } = ctx.app.models

  const user_id = ctx.state.user.id
  const listNameId = R.prop('name_id', list) || null

  const unrankedItems = await Item.query()
    .skipUndefined()
    .leftJoinRelation('list')
    .whereNotIn('items.id', UserRanking.query()
      .select('item_id')
      .where({user_id})
    )
    .andWhere('list.name_id', listNameId)

  ctx.body = unrankedItems

  await next()
})
