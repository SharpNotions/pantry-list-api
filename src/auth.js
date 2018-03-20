const { OAuth2Client } = require('google-auth-library');

const CLIENT_ID =
  '270040816063-djog7f8mpvt4m162ak4n04bjmftg1bhc.apps.googleusercontent.com';
const client = new OAuth2Client(CLIENT_ID);

const requireAuth = async (ctx, next) => {
  const [_, idToken] = ctx.header.authorization.split(' ');
  const ticket = await client.verifyIdToken({
    idToken,
    audience: CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (payload.hd === 'sharpnotions.com') {
    await next();
  } else {
    ctx.status = 401;
    ctx.body = {
      errors: [{ title: 'Not authorized', status: 401 }],
    };
  }
};

module.exports = requireAuth;
