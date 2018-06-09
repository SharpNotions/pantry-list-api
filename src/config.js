const clientId = '270040816063-djog7f8mpvt4m162ak4n04bjmftg1bhc.apps.googleusercontent.com';
const scope = ['profile', 'email'];
const callback = '/handle_google_callback'
const transport = 'session';

module.exports = {
  development:  {
    server: {
      protocol: 'http',
      host: 'localhost:4000',
      transport
    },
    google: {
      key: clientId,
      secret: process.env.GOOGLE_CLIENT_SECRET,
      callback,
      scope
    }
  },
  production:  {
    server: {
      protocol: 'https',
      host: 'pantry-list-api.herokuapp.com',
      transport
    },
    google: {
      key: clientId,
      secret: process.env.GOOGLE_CLIENT_SECRET,
      callback,
      scope
    }
  }
}