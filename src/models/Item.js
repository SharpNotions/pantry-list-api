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
        id: { type: 'integer' },
        item_name: { type: 'string', minLength: 1, maxLength: 255 },
        item_details: {
          type: 'object',
          properties: {
            description: { type: 'string' },
            image_url: { type: 'string' }
          }
        },
        list_id: {type: 'integer'}
      }
    }
  }

  static get relationMappings() {
    const UserRanking = require('./UserRanking');
    const List        = require('./List');

    return {
      userRankings: {
        relation: Model.HasManyRelation,
        modelClass: UserRanking,
        join: {
          from: 'items.id',
          to: 'user_rankings.item_id'
        }
      },
      list: {
        relation: Model.BelongsToOneRelation,
        modelClass: List,
        join: {
          from: 'items.list_id',
          to: 'lists.id'
        }
      }
    }
  }
}

module.exports = Item;
