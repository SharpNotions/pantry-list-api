const path = require('path');

const config = (nodeEnv) => ({
  client: 'pg',
  connection: {
    test       : process.env.DATABASE_URL || 'postgres://localhost/pantry_list_test',
    development: 'postgres://localhost/pantry_list',
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
