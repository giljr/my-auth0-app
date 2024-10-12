
// auth.js
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport');
const Auth0Strategy = require('passport-auth0');
const { auth, requiresAuth } = require('express-openid-connect');

const app = express();

// Auth0 configuration
const config = {
    authRequired: false,
    auth0Logout: true,
    secret: process.env.AUTH0_SECRET,
    baseURL: process.env.BASE_URL,
    clientID: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}`,
    authorizationParams: {
      response_type: 'code', // Ensure the correct grant type
      scope: 'openid profile email', // Ensure that profile and email are part of the requested scopes
    },
  };
  
// Auth0 middleware
app.use(auth(config));

// Auth0 Configuration
passport.use(
  new Auth0Strategy(
    {
      domain: process.env.AUTH0_DOMAIN,
      clientID: process.env.AUTH0_CLIENT_ID,
      clientSecret: process.env.AUTH0_CLIENT_SECRET,
      callbackURL: process.env.AUTH0_CALLBACK_URL
    },
    function (accessToken, refreshToken, extraParams, profile, done) {
      return done(null, profile);
    }
  )
);

// Session Configuration 
// Run: openssl rand -hex 32
app.use(
  session({
    secret: '444d5ad87018706c226ec651bbe4cb71efaf62fb7488f56b5971ca19b8bf250d',
    resave: false,
    saveUninitialized: true,
  })
);

// Passport Initialization
app.use(passport.initialize());
app.use(passport.session());

// Serialize/Deserialize User
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// Auth0 Routes

// Login Route
app.get(
  '/login',
  passport.authenticate('auth0', {
    scope: 'openid email profile',
  }),
  function (req, res) {
    res.redirect('/');
  }
);

// Callback URL after Auth0 login
app.get(
  '/callback',
  passport.authenticate('auth0', { failureRedirect: '/' }),
  function (req, res) {
    res.redirect(req.session.returnTo || '/');
  }
);

// Logout Route
app.get('/logout', (req, res) => {
  req.logout(() => {
    res.redirect(
      `https://${process.env.AUTH0_DOMAIN}/v2/logout?client_id=${process.env.AUTH0_CLIENT_ID}&returnTo=${encodeURIComponent(
        'http://localhost:5000'
      )}`
    );
  });
});

// // Home Route (Protected)
// app.get('/', (req, res) => {
//   if (req.isAuthenticated()) {
//     res.send(`Hello, ${req.user.displayName}! <a href="/logout">Logout</a>`);
//   } else {
//     res.send('<a href="/login">Login</a>');
//   }
// });

// Home route
app.get('/', (req, res) => {
    res.send(req.oidc.isAuthenticated() ? `Hello ${req.oidc.user.name}` : 'Logged out');
  });



app.get('/profile', requiresAuth(), (req, res) => {
  res.send(JSON.stringify(req.oidc.user));
});


// Start the server
app.listen(5000, () => {
  console.log('Server is running on http://localhost:5000');
});
