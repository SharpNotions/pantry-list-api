const sinon         = require('sinon');
const R             = require('ramda');
const {getDbModels} = require('./helpers');

jest.mock('google-auth-library');
const googleAuthLibrary = require('google-auth-library');
googleAuthLibrary.OAuth2Client = function () {
    return {
      verifyIdToken: async () => ({
        getPayload: () => ({
          sub: 'sub',
          email: 'email@com.com',
          given_name: 'Sharp',
          family_name: 'McNotions'
        })
      })
    };
};

const auth  = require('../src/auth');

describe('auth', () => {
  let db;
  let models;

  beforeAll(() => {
    db = require('../src/db/connection');
    models = getDbModels(db);
  });

  afterAll(() => {
    db.destroy();
  });

  beforeEach(async () => {
    await db.migrate.rollback();
    await db.migrate.latest();
  });

  it('should save new user', async () => {
    const ctx = {
      header: {authorization: 'Basic 123'},
      assert: () => {},
      app: {models},
      state: {}
    };

    await auth(ctx, () => {});

    expect(ctx.state).toHaveProperty('user');
    expect(ctx.state.user).toMatchObject({
      email: 'email@com.com',
      first_name: 'Sharp',
      last_name: 'McNotions',
    });
  });
});
