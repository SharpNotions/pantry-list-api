const Model = require('objection').Model;

class Item extends Model {
  // Table name is the only required property.
  static get tableName() {
    return 'items';
  }
}

module.exports = Item;
