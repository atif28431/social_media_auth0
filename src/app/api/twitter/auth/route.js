import { NextResponse } from 'next/server';
import crypto from 'crypto';

const TWITTER_API_KEY = process.env.TWITTER_API_KEY;
const TWITTER_API_SECRET = process.env.TWITTER_API_SECRET;
const TWITTER_CALLBACK_URL = process.env.TWITTER_CALLBACK_URL || 'http://localhost:3000/api/twitter/callback';

function createSignature(method, url, params, tokenSecret = '') {
  const parameterString = Object.keys(params)
    .sort()
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');

  const signatureBaseString = `${method.toUpperCase()}&${encodeURIComponent(url)}&${encodeURIComponent(parameterString)}`;
  const signingKey = `${encodeURIComponent(TWITTER_API_SECRET)}&${encodeURIComponent(tokenSecret)}`;

  return crypto
    .createHmac('sha1', signingKey)
    .update(signatureBaseString)
    .digest('base64');
}

function createAuthHeader(params) {
  const authParams = Object.keys(params)
    .filter(key => key.startsWith('oauth_'))
    .sort()
    .map(key => `${encodeURIComponent(key)}="${encodeURIComponent(params[key])}"`)
    .join(', ');

  return `OAuth ${authParams}`;
}

export async function GET(request) {
  try {
    // Step 1: Get request token from Twitter
    const requestTokenParams = {
      oauth_consumer_key: TWITTER_API_KEY,
      oauth_nonce: crypto.randomBytes(32).toString('base64'),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000),
      oauth_callback: TWITTER_CALLBACK_URL,
      oauth_version: '1.0'
    };

    const signature = createSignature('POST', 'https://api.twitter.com/oauth/request_token', requestTokenParams);
    requestTokenParams.oauth_signature = signature;

    const authHeader = createAuthHeader(requestTokenParams);

    const response = await fetch('https://api.twitter.com/oauth/request_token', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to get request token from Twitter' },
        { status: 500 }
      );
    }

    const responseText = await response.text();
    const tokenData = new URLSearchParams(responseText);
    
    const oauthToken = tokenData.get('oauth_token');
    const oauthTokenSecret = tokenData.get('oauth_token_secret');

    if (!oauthToken || !oauthTokenSecret) {
      return NextResponse.json(
        { error: 'Invalid response from Twitter' },
        { status: 500 }
      );
    }

    // Store the token secret in a cookie for later use in callback
    const redirectUrl = `https://api.twitter.com/oauth/authenticate?oauth_token=${oauthToken}`;
    
    const responseObj = NextResponse.redirect(redirectUrl);
    
    // Store the token secret in a cookie
    responseObj.cookies.set('twitter_token_secret', oauthTokenSecret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 5, // 5 minutes
      path: '/'
    });

    // Also store the oauth token for verification
    responseObj.cookies.set('twitter_oauth_token', oauthToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 5, // 5 minutes
      path: '/'
    });

    return responseObj;

  } catch (error) {
    console.error('Twitter auth error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}