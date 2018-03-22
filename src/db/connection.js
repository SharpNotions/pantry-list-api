const environment = process.env.NODE_ENV || 'development';
const config = require('../../config/db.js')(environment);

module.exports = require('knex')(config);
