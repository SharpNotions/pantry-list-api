const sinon = require('sinon');
const R     = require('ramda');

describe('hello', () => {
  const hello = sinon.stub().returns('Hello, beautiful!');

  it('should say hello', () => {
    console.log('ENV', process.env.NODE_ENV);


    const conn = require('../src/db/connection');

    return (async () => {
      const res = await conn.raw('SELECT table_schema,table_name FROM information_schema.tables;');
      R.forEach(R.pipe(JSON.stringify, console.log), res.rows);

      expect(hello()).toBe('Hello, beautiful!');

    })();


  });
});
