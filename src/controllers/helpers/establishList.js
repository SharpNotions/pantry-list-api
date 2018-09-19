module.exports = (handler) => async (ctx, next) => {
  const List = ctx.app.models.List
  const name_id = ctx.request.query.list || null

  let dbList = (await List.query()
    .where('name_id', name_id))[0]

  if (!dbList) {
    dbList = await List.query()
      .insert({
        name_id
      })
  }

  return handler(dbList)(ctx, next)
}
