import { NextResponse } from 'next/server';

const INSTAGRAM_CLIENT_ID = process.env.INSTAGRAM_CLIENT_ID;
const INSTAGRAM_CLIENT_SECRET = process.env.INSTAGRAM_CLIENT_SECRET;
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;
const NEXTAUTH_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

export async function POST(request) {
  try {
    const { platform } = await request.json();

    if (!platform || !['instagram', 'facebook'].includes(platform)) {
      return NextResponse.json(
        { error: 'Invalid platform specified' },
        { status: 400 }
      );
    }

    let authUrl;
    const state = generateState();

    if (platform === 'instagram') {
      // Instagram Login API
      if (!INSTAGRAM_CLIENT_ID || !INSTAGRAM_CLIENT_SECRET) {
        return NextResponse.json(
          { error: 'Instagram API credentials not configured' },
          { status: 500 }
        );
      }

      const scopes = [
        'user_profile',
        'user_media',
        'instagram_graph_user_profile',
        'instagram_graph_user_media'
      ].join(' ');

      const params = new URLSearchParams({
        client_id: INSTAGRAM_CLIENT_ID,
        redirect_uri: `${NEXTAUTH_URL}/api/instagram/callback`,
        scope: scopes,
        response_type: 'code',
        state: state,
      });

      authUrl = `https://api.instagram.com/oauth/authorize?${params.toString()}`;
    } else {
      // Facebook Graph API
      if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
        return NextResponse.json(
          { error: 'Facebook API credentials not configured' },
          { status: 500 }
        );
      }

      const scopes = [
        'instagram_basic',
        'instagram_content_publish',
        'instagram_manage_insights',
        'pages_show_list',
        'pages_read_engagement',
        'business_management'
      ].join(',');

      const params = new URLSearchParams({
        client_id: FACEBOOK_APP_ID,
        redirect_uri: `${NEXTAUTH_URL}/api/facebook/callback`,
        scope: scopes,
        response_type: 'code',
        state: state,
        auth_type: 'rerequest'
      });

      authUrl = `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
    }

    // Store state in session or cache for validation
    // In production, use a proper session store
    const response = NextResponse.json({ authUrl });
    
    // Set state cookie for CSRF protection
    response.cookies.set('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10 // 10 minutes
    });

    return response;

  } catch (error) {
    console.error('Auth initialization error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize authentication' },
      { status: 500 }
    );
  }
}

function generateState() {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}