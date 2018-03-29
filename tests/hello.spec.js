const sinon = require('sinon');
const R     = require('ramda');

describe('hello', () => {
  let db;
  const hello = sinon.stub().returns('Hello, beautiful!');

  beforeAll(() => {
    db = require('../src/db/connection');
  });

  afterAll(async () => {
    await db.destroy()
  });

  beforeEach(async () => {
    await db.migrate.rollback();
    await db.migrate.latest();
  });

  it('should connect to db', async () => {
    const res = await db.raw('SELECT table_name FROM information_schema.tables;');

    expect(res).toHaveProperty('rows');
    expect(res.rows.length).toBeGreaterThan(0);
  });
});
