const { OAuth2Client } = require('google-auth-library');
const { path }  = require('ramda');

const CLIENT_ID =
  '270040816063-djog7f8mpvt4m162ak4n04bjmftg1bhc.apps.googleusercontent.com';
const client = new OAuth2Client(CLIENT_ID);

const getUser = async (ctx, payload) => {
  let [user] = await ctx.app.models.User.query()
    .where('auth_id', payload.sub);

  if (!user) {
    user = await ctx.app.models.User.query()
      .insert({
        auth_id   : payload.sub,
        email     : payload.email,
        first_name: payload.given_name,
        last_name : payload.family_name
      })
      .returning('*');
  }

  return user;
};

const requireAuth = async (ctx, next) => {
  const authHeader = ctx.header.authorization;
  const authCookie = ctx.cookies.get('id_token');
  if (!authHeader && !authCookie) {
    ctx.cookies.set('after_login',ctx.request.url);
    return ctx.redirect(`/connect/google`);
  }
  ctx.assert(authHeader || authCookie, 401, 'No auth found.');
  const idToken = authHeader ? ctx.header.authorization.split(' ')[1]
                             : authCookie;
  ctx.assert(idToken, 401, 'ID token not found');

  if (idToken === process.env.SLACK_TOKEN) {
    const userEmail = path(['request', 'query', 'user'], ctx)
    ctx.assert(userEmail, 401, 'User query param not present')

    const [user] = await ctx.app.models.User.query().where('email', userEmail)
    ctx.assert(user, 401, 'User email not found.')

    ctx.state.user = user
    return await next()
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: CLIENT_ID,
    });
    const payload = ticket.getPayload();
    ctx.assert(payload.hd === 'sharpnotions.com', 401, 'Not authorized');

    ctx.state.user = await getUser(ctx, payload);

    await next()
  } catch (err) {
    ctx.status = 401;
    ctx.body = {
      errors: [err.message],
    };
  };
};

module.exports = requireAuth;
