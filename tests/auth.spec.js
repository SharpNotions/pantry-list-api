const sinon         = require('sinon');
const R             = require('ramda');
const {getDbModels} = require('./helpers');

jest.mock('google-auth-library');
const googleAuthLibrary = require('google-auth-library');
const getPayloadMock = jest.fn(() => ({
  sub: 'sub',
  email: 'email@com.com',
  given_name: 'Sharp',
  family_name: 'McNotions'
}))
googleAuthLibrary.OAuth2Client = function () {
    return {
      verifyIdToken: async () => ({
        getPayload: getPayloadMock
      })
    };
};

const auth  = require('../src/auth');

describe('auth', () => {
  let db;
  let models;
  let ctx;

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

    ctx = {
      header: {authorization: 'Basic 123'},
      assert: () => {},
      app: {models},
      state: {},
      cookies: {get: () => {}}
    };
  });

  afterEach(() => {
    if (ctx.body) {
      expect(ctx.body).not.toHaveProperty('errors');
    }
    jest.clearAllMocks()
  });

  it('should store user in ctx.state', async () => {
    await auth(ctx, () => {});

    expect(ctx.state).toHaveProperty('user');
    expect(ctx.state.user).toMatchObject({
      email: 'email@com.com',
      first_name: 'Sharp',
      last_name: 'McNotions',
    });
  });

  it('should create new user record', async () => {
    expect(await models.User.query()).toHaveLength(0);
    await auth(ctx, () => {});
    expect(await models.User.query()).toHaveLength(1);
  });

  it('should not create new user record if user exists', async () => {
    await models.User.query()
      .insert({
        auth_id    : 'sub',
        email      : 'email@com.com',
        first_name : 'Sharp',
        last_name  : 'McNotions'
      });

    expect(await models.User.query()).toHaveLength(1);
    await auth(ctx, () => {});
    expect(await models.User.query()).toHaveLength(1);
  });

  it('should allow slack token to be used for auth', async () => {
    ctx.header.authorization = 'Basic my_slack_token'
    process.env.SLACK_TOKEN = 'my_slack_token'
    await auth(ctx, () => {});
    expect(getPayloadMock).toHaveBeenCalledTimes(0)
  });
});
