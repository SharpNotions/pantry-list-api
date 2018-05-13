const path = require('path');
const baseConfig = {
  user: process.env.DATABASE_USER || 'pantry_user',
  password: process.env.DATABASE_PASS || 'pantry_pass',
  host: process.env.DATABASE_URL || 'pantry-list-api_pg_1',
  database: process.env.DATABASE_NAME || 'pantry'
}

// Build a connection string from a given configuration
const getConnectionString = ({ user, password, host, database }) =>
  `postgres://${user}:${password}@${host}/${database}`

const config = (nodeEnv) => ({
  client: 'pg',
  connection: {
    test       : getConnectionString({
      ...baseConfig,
      database: 'pantry_test'
    }),
    development: getConnectionString(baseConfig),
    // Production connection string is managed by Heroku
    production : process.env.DATABASE_URL
  }[nodeEnv],
  migrations: {
    directory: path.join(__dirname, 'src', 'db', 'migrations')
  }
});

module.exports = {
  development: config('development'),
  test       : config('test'),
  production : config('production')
}
