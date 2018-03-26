
exports.up = knex =>
  knex.schema.createTable('users', table => {
    table.increments('id')
    table.string('auth_id')
      .notNullable(),
    table.string('email')
      .notNullable()
      .unique(),
    table.string('first_name'),
    table.string('last_name'),
    table.timestamps(true, true)
    table.timestamp('deleted_at')
  })

exports.down = knex =>
  knex.schema.dropTable('users')
