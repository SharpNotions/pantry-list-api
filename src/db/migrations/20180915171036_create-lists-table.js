exports.up = knex =>
  knex.schema.createTable('lists', table => {
    table.increments('id')
    table.string('name_id')
      .unique()
    table.timestamps(true, true)
  })

exports.down = knex =>
  knex.schema.dropTable('lists')
