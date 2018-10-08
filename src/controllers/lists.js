exports.getAllLists = async (ctx, next) => {
  const { List } = ctx.app.models

  const allLists = await List.query()
    .skipUndefined()
    .select('name_id')

  ctx.body = allLists

  await next()
}
