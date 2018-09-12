exports.up = knex =>
  knex.schema.createTable('rankings_snapshots', table => {
    table.increments('id')
    table.jsonb('snapshot')
    table.timestamps(true, true)
  })

exports.down = knex =>
  knex.schema.dropTable('rankings_snapshots')
