const Model = require('objection').Model;

class User extends Model {
  static get tableName() {
    return 'users';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['auth_id', 'first_name', 'last_name'],
      properties: {
        email     : { type: 'string', format: 'email' },
        first_name: { type: 'string', minLength: 1, maxLength: 255 },
        last_name : { type: 'string', minLength: 1, maxLength: 255 }
      }
    };
  }
}

module.exports = User;
