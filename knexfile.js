const path = require('path');
const baseConfig = {
  user: process.env.DATABASE_USER || 'pantry_user',
  password: process.env.DATABASE_PASS || 'pantry_pass',
  host: process.env.DATABASE_HOST || 'localhost',
  port: process.env.DATABASE_PORT || '5432',
  database: process.env.DATABASE_NAME || 'pantry'
}

// Build a connection string from a given configuration
const getConnectionString = ({ user, password, host, database, port }) =>
  `postgres://${user}:${password}@${host}:${port}/${database}`

const config = (nodeEnv) => ({
  client: 'pg',
  connection: {
    test       : process.env.DATABASE_URL || getConnectionString({
      ...baseConfig,
      database: 'pantry_test'
    }),
    development: process.env.DATABASE_URL || getConnectionString(baseConfig),
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
