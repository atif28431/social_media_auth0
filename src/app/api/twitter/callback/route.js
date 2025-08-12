import { NextResponse } from 'next/server';
import crypto from 'crypto';

const TWITTER_API_KEY = process.env.TWITTER_API_KEY;
const TWITTER_API_SECRET = process.env.TWITTER_API_SECRET;
const NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

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
    .sort()
    .map(key => `${encodeURIComponent(key)}="${encodeURIComponent(params[key])}"`)
    .join(', ');

  return `OAuth ${authParams}`;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const oauth_token = searchParams.get('oauth_token');
    const oauth_verifier = searchParams.get('oauth_verifier');
    const denied = searchParams.get('denied');

    if (denied) {
      return NextResponse.redirect(new URL('/auth/error?error=access_denied', request.url));
    }

    if (!oauth_token || !oauth_verifier) {
      return NextResponse.redirect(new URL('/auth/error?error=missing_params', request.url));
    }

    // Get stored token secret from cookie
    const tokenSecret = request.cookies.get('twitter_token_secret')?.value;
    if (!tokenSecret) {
      return NextResponse.redirect(new URL('/auth/error?error=session_expired', request.url));
    }

    // Exchange request token for access token
    const accessTokenParams = {
      oauth_consumer_key: TWITTER_API_KEY,
      oauth_nonce: crypto.randomBytes(32).toString('base64'),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000),
      oauth_token: oauth_token,
      oauth_verifier: oauth_verifier,
      oauth_version: '1.0'
    };

    const signature = createSignature('POST', 'https://api.twitter.com/oauth/access_token', accessTokenParams, tokenSecret);
    accessTokenParams.oauth_signature = signature;

    const authHeader = createAuthHeader(accessTokenParams);

    const response = await fetch('https://api.twitter.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `oauth_verifier=${oauth_verifier}`
    });

    if (!response.ok) {
      return NextResponse.redirect(new URL('/auth/error?error=token_exchange_failed', request.url));
    }

    const responseText = await response.text();
    const accessData = new URLSearchParams(responseText);
    
    const accessToken = accessData.get('oauth_token');
    const accessTokenSecret = accessData.get('oauth_token_secret');
    const userId = accessData.get('user_id');
    const screenName = accessData.get('screen_name');

    if (!accessToken || !accessTokenSecret) {
      return NextResponse.redirect(new URL('/auth/error?error=invalid_response', request.url));
    }

    // Fetch user profile
    const profileParams = {
      oauth_consumer_key: TWITTER_API_KEY,
      oauth_nonce: crypto.randomBytes(32).toString('base64'),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000),
      oauth_token: accessToken,
      oauth_version: '1.0',
      user_id: userId
    };

    const profileSignature = createSignature('GET', 'https://api.twitter.com/1.1/users/show.json', profileParams, accessTokenSecret);
    profileParams.oauth_signature = profileSignature;

    const profileAuthHeader = createAuthHeader(profileParams);

    const profileResponse = await fetch(`https://api.twitter.com/1.1/users/show.json?user_id=${userId}`, {
      headers: {
        'Authorization': profileAuthHeader
      }
    });

    if (!profileResponse.ok) {
      return NextResponse.redirect(new URL('/auth/error?error=profile_fetch_failed', request.url));
    }

    const profileData = await profileResponse.json();

    // Create response with redirect
    const redirectUrl = new URL('/auth/success', request.url);
    redirectUrl.searchParams.set('provider', 'twitter');
    redirectUrl.searchParams.set('username', screenName);
    redirectUrl.searchParams.set('name', profileData.name);
    redirectUrl.searchParams.set('profile_image', profileData.profile_image_url_https);
    redirectUrl.searchParams.set('user_id', userId);

    const response = NextResponse.redirect(redirectUrl);
    
    // Clear the token secret cookie
    response.cookies.set('twitter_token_secret', '', {
      maxAge: 0,
      path: '/'
    });

    // Store tokens in secure cookies
    response.cookies.set('twitter_access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/'
    });

    response.cookies.set('twitter_access_token_secret', accessTokenSecret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Twitter callback error:', error);
    return NextResponse.redirect(new URL('/auth/error?error=server_error', request.url));
  }
}
    }

    // Exchange verifier for access token
    const url = 'https://api.twitter.com/oauth/access_token';
    const params = {
      oauth_consumer_key: TWITTER_API_KEY,
      oauth_token: oauth_token,
      oauth_verifier: oauth_verifier,
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000),
      oauth_nonce: crypto.randomBytes(32).toString('hex'),
      oauth_version: '1.0'
    };

    params.oauth_signature = createSignature('POST', url, params, tokenSecret);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': createAuthHeader(params),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to exchange token');
    }

    const responseText = await response.text();
    const tokenParams = new URLSearchParams(responseText);
    
    const accessToken = tokenParams.get('oauth_token');
    const accessTokenSecret = tokenParams.get('oauth_token_secret');
    const userId = tokenParams.get('user_id');
    const screenName = tokenParams.get('screen_name');

    // Get user profile
    const profileUrl = 'https://api.twitter.com/1.1/account/verify_credentials.json';
    const profileParams = {
      oauth_consumer_key: TWITTER_API_KEY,
      oauth_token: accessToken,
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000),
      oauth_nonce: crypto.randomBytes(32).toString('hex'),
      oauth_version: '1.0'
    };

    profileParams.oauth_signature = createSignature('GET', profileUrl, profileParams, accessTokenSecret);

    const profileResponse = await fetch(`${profileUrl}?include_entities=false&skip_status=true`, {
      headers: {
        'Authorization': createAuthHeader(profileParams),
      },
    });

    if (!profileResponse.ok) {
      throw new Error('Failed to fetch user profile');
    }

    const profile = await profileResponse.json();

    // Store user data
    const userData = {
      platform: 'twitter',
      userId: userId,
      username: screenName,
      displayName: profile.name,
      profileImage: profile.profile_image_url_https,
      followersCount: profile.followers_count,
      followingCount: profile.friends_count,
      tweetCount: profile.statuses_count,
      accessToken: accessToken,
      accessTokenSecret: accessTokenSecret,
      connectedAt: new Date().toISOString()
    };

    // Redirect to dashboard
    const redirectUrl = new URL('/dashboard', request.url);
    redirectUrl.searchParams.set('platform', 'twitter');
    redirectUrl.searchParams.set('username', screenName);

    const response = NextResponse.redirect(redirectUrl);
    
    // Set secure cookies
    response.cookies.set('twitter_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    });
    
    response.cookies.set('twitter_token_secret', accessTokenSecret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30
    });
    
    response.cookies.set('twitter_user_id', userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30
    });

    // Clear temporary cookies
    response.cookies.delete('twitter_token_secret');
    response.cookies.delete('twitter_oauth_token');

    return response;

  } catch (error) {
    console.error('Twitter callback error:', error);
    return NextResponse.redirect(new URL('/auth/error?error=callback_failed', request.url));
  }
}