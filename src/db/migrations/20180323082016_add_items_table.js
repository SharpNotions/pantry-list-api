const tableName = 'items'

exports.up = knex =>
  knex.schema.createTable(tableName, table => {
    table.increments('id')
    table.string('item_name')
    table.jsonb('item_details')
    table.timestamps(true, true)
    table.timestamp('deleted_at')
})

exports.down = knex => knex.schema.dropTable(tableName)
