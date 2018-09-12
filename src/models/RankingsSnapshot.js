const {Model} = require('objection')

class RankingsSnapshot extends Model {
  // Table name is the only required property.
  static get tableName() {
    return 'rankings_snapshots';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['snapshot'],
      properties: {
        id: { type: 'integer' },
        snapshot: {
          type: 'object',
          properties: {
            user_rankings: { type: 'array' },
            total_rankings: { type: 'array' }
          }
        }
      }
    }
  }
}

module.exports = RankingsSnapshot;
