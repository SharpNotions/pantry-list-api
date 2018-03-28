const tableName = 'user_rankings'

exports.up = knex => 
  knex.schema.createTable(tableName, table => {
    table.increments('id')
    table.integer('item_id')
      .notNullable()
      .references('id')
      .inTable('items')
    table.integer('user_id')
      .notNullable()
      .references('id')
      .inTable('users')
    table.integer('prev_ranking_id')
      .unique(),
    table.timestamps(true, true)
    table.timestamp('deleted_at')

    table.foreign('prev_ranking_id')
      .references('id')
      .inTable('user_rankings')
  })

exports.down = knex =>
  knex.schema.dropTable(tableName)
