const { transaction } = require('objection');
const fetch = require('node-fetch');

exports.addItem = async (ctx, next) => {
  const graph = ctx.request.body;
  const Item = ctx.app.models.Item;
  const insertedGraph = await transaction(Item.knex(), trx =>
    Item.query(trx).insert(graph)
  );
  ctx.body = insertedGraph;
  fetch('https://pantry-list-slack-bot.now.sh/item-added', {
    method: 'POST',
    body: JSON.stringify({ item_name: graph.item_name })
  });
};
