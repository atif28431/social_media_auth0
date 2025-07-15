import { Auth0Client } from "@auth0/nextjs-auth0/server";

export const auth0 = new Auth0Client({
  domain: process.env.AUTH0_DOMAIN,
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  secret: process.env.AUTH0_SECRET,
  appBaseUrl: process.env.AUTH0_BASE_URL || process.env.APP_BASE_URL,
  authorizationParameters: {
    scope: 'openid profile email'
  },
  routes: {
    login: '/auth/login',
    logout: '/auth/logout', 
    callback: '/auth/callback',
    profile: '/auth/profile',
    postLogoutRedirect: process.env.AUTH0_POST_LOGOUT_REDIRECT || '/logged-out'
  }
});
