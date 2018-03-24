const tableName = 'items';

exports.up = knex =>
  knex.schema.alterTable(tableName, table => table.unique('item_name'));

exports.down = knex =>
  knex.schema.alterTable(tableName, table => table.dropUnique('item_name'));
