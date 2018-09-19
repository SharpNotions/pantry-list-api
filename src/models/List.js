const { Model } = require('objection')

class List extends Model {
  // Table name is the only required property.
  static get tableName() {
    return 'lists';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['name_id'],
      properties: {
        id: {
          type: 'integer'
        },
        name_id: {
          type: ['string', null]
        }
      }
    }
  }

  static get relationMappings() {
    const UserRanking = require('./UserRanking');
    const Item        = require('./Item');

    return {
      userRankings: {
        relation: Model.HasManyRelation,
        modelClass: UserRanking,
        join: {
          from: 'lists.id',
          to: 'user_rankings.list_id'
        }
      },
      items: {
        relation: Model.HasManyRelation,
        modelClass: Item,
        join: {
          from: 'lists.id',
          to: 'items.list_id'
        }
      }
    }
  }
}

module.exports = List;
