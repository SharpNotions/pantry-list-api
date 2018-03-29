exports.up = async (knex) => {
  await knex.schema.alterTable('items', table => {
    table.dropColumn('deleted_at')
  })

  await knex.schema.alterTable('users', table => {
    table.dropColumn('deleted_at')
  })
}

exports.down = async (knex) => {
  await knex.schema.alterTable('items', table => {
    table.timestamp('deleted_at')
  })

  await knex.schema.alterTable('users', table => {
    table.timestamp('deleted_at')
  })
}
