const { OAuth2Client } = require('google-auth-library');

const CLIENT_ID =
  '270040816063-djog7f8mpvt4m162ak4n04bjmftg1bhc.apps.googleusercontent.com';
const client = new OAuth2Client(CLIENT_ID);

const requireAuth = async (ctx, next) => {
  ctx.assert(ctx.header.authorization, 401, 'No auth header found.');
  const [_, idToken] = ctx.header.authorization.split(' ');
  ctx.assert(idToken, 401, 'ID token not found');

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: CLIENT_ID,
    });
    const payload = ticket.getPayload();
    ctx.assert(payload.hd === 'sharpnotions.com', 401, 'Not authorized');

    await next();
  } catch (err) {
    ctx.status = 401;
    ctx.body = {
      errors: [err.message],
    };
  };
};

module.exports = requireAuth;
