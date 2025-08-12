import { NextResponse } from 'next/server';

const INSTAGRAM_APP_ID = process.env.INSTAGRAM_APP_ID;
const INSTAGRAM_APP_SECRET = process.env.INSTAGRAM_APP_SECRET;
const NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const error_reason = searchParams.get('error_reason');

    // Validate state for CSRF protection
    const storedState = request.cookies.get('oauth_state')?.value;
    if (!state || state !== storedState) {
      return NextResponse.redirect(new URL('/auth/error?error=invalid_state', request.url));
    }

    if (error) {
      return NextResponse.redirect(new URL(`/auth/error?error=${error}&reason=${error_reason}`, request.url));
    }

    if (!code) {
      return NextResponse.redirect(new URL('/auth/error?error=missing_code', request.url));
    }

    // Exchange code for access token
    const tokenUrl = 'https://api.instagram.com/oauth/access_token';
    const tokenParams = new URLSearchParams({
      client_id: INSTAGRAM_APP_ID,
      client_secret: INSTAGRAM_APP_SECRET,
      grant_type: 'authorization_code',
      redirect_uri: `${NEXTAUTH_URL}/api/instagram/callback`,
      code: code,
    });

    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: tokenParams,
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      throw new Error(errorData.error_message || 'Failed to exchange code for token');
    }

    const tokenData = await tokenResponse.json();
    const { access_token, user_id } = tokenData;

    // Get user profile
    const profileUrl = `https://graph.instagram.com/${user_id}`;
    const profileParams = new URLSearchParams({
      fields: 'id,username,account_type,media_count',
      access_token: access_token,
    });

    const profileResponse = await fetch(`${profileUrl}?${profileParams}`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!profileResponse.ok) {
      throw new Error('Failed to fetch user profile');
    }

    const profile = await profileResponse.json();

    // Get more detailed user info if business account
    let detailedProfile = null;
    if (profile.account_type === 'BUSINESS') {
      try {
        const detailedParams = new URLSearchParams({
          fields: 'id,username,account_type,media_count,followers_count,follows_count,biography,profile_picture_url',
          access_token: access_token,
        });

        const detailedResponse = await fetch(`${profileUrl}?${detailedParams}`);
        if (detailedResponse.ok) {
          detailedProfile = await detailedResponse.json();
        }
      } catch (error) {
        console.warn('Could not fetch detailed business profile:', error);
      }
    }

    // Store user data
    const userData = {
      platform: 'instagram',
      userId: user_id,
      username: profile.username,
      accountType: profile.account_type,
      mediaCount: profile.media_count,
      followersCount: detailedProfile?.followers_count || 0,
      followingCount: detailedProfile?.follows_count || 0,
      profileImage: detailedProfile?.profile_picture_url || null,
      biography: detailedProfile?.biography || null,
      accessToken: access_token,
      connectedAt: new Date().toISOString()
    };

    // Redirect to dashboard
    const redirectUrl = new URL('/dashboard', request.url);
    redirectUrl.searchParams.set('platform', 'instagram');
    redirectUrl.searchParams.set('username', profile.username);

    const response = NextResponse.redirect(redirectUrl);
    
    // Set secure cookies
    response.cookies.set('instagram_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30 // 30 days
    });
    
    response.cookies.set('instagram_user_id', user_id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30
    });

    // Clear state cookie
    response.cookies.delete('oauth_state');

    return response;

  } catch (error) {
    console.error('Instagram callback error:', error);
    return NextResponse.redirect(new URL('/auth/error?error=callback_failed', request.url));
  }
}