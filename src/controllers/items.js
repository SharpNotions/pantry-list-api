const { transaction } = require('objection');

exports.addItem = async (ctx, next) => {
  const graph = ctx.request.body;
  const Item = ctx.app.models.Item;
  const insertedGraph = await transaction(Item.knex(), trx =>
    Item.query(trx).insert(graph)
  );
  ctx.body = insertedGraph;
};
