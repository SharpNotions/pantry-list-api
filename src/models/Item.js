const Model = require('objection').Model;

class Item extends Model {
  // Table name is the only required property.
  static get tableName() {
    return 'items';
  }
  static get jsonSchema() {
    return {
      type: 'object',
      required: ['item_name'],
      properties: {
        item_name: { type: 'string', minLength: 1, maxLength: 255 },
        item_details: {
          type: 'object',
          properties: {}
        }
      }
    };
  }
}

module.exports = Item;