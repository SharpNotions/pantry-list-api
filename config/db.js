const path = require('path');

const BASE_PATH = path.join(__dirname, 'src', 'db');

module.exports = (nodeEnv) => ({
  client: 'pg',
  connection: {
    test: process.env.DATABASE_URL,
    development: 'postgres://localhost:5432',
    production: process.env.DATABASE_URL
  }[nodeEnv],
  migrations: {
    directory: path.join(BASE_PATH, 'migrations')
  }
});
