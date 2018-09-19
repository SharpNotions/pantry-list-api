exports.up = async knex => {
  await knex.schema.raw(`
    INSERT INTO lists (id, name_id, created_at, updated_at)
    SELECT nextval('lists_id_seq'), NULL, now(), now()
    WHERE
    NOT EXISTS (
        SELECT id FROM lists WHERE name_id = NULL
    );
  `)

  const {id: nullListId} = (await knex.select('id').from('lists').where({name_id: null}))[0]

  await knex.schema.table('items', table => {
    table.integer('list_id')
      .notNullable()
      .defaultTo(nullListId)
      .references('id')
      .inTable('lists')
  })

  await knex.schema.table('user_rankings', table => {
    table.integer('list_id')
      .notNullable()
      .defaultTo(nullListId)
      .references('id')
      .inTable('lists')
  })
}

exports.down = async knex => {
  await knex.schema.table('items', table => {
    table.dropColumn('list_id')
  })

  await knex.schema.table('user_rankings', table => {
    table.dropColumn('list_id')
  })
}
