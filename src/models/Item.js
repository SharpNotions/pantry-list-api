const {Model} = require('objection')

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
          properties: {
            description: { type: 'string' }
          }
        }
      }
    }
  }

  static get relationMappings() {
    const UserRanking = require('./UserRanking');
    return {
      userRankings: {
        relation: Model.HasManyRelation,
        modelClass: UserRanking,
        join: {
          from: 'items.id',
          to: 'user_rankings.item_id'
        }
      }
    }
  }
}

module.exports = Item;
