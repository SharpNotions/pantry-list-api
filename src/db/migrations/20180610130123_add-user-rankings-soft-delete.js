exports.up = async (knex) => {
  await knex.schema.alterTable('user_rankings', table => {
    table.timestamp('deleted_at')
  })
}

exports.down = async (knex) => {
  await knex.schema.alterTable('user_rankings', table => {
    table.dropColumn('deleted_at')
  })
}

