import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');

    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID) {
      return NextResponse.json(
        { error: 'Instagram App ID not configured' },
        { status: 500 }
      );
    }

    // Generate state parameter with user_id
    const state = user_id;
    
    // Instagram Basic Display API scopes
    const scopes = [
      'instagram_business_basic',
      'instagram_business_manage_messages',
      'instagram_business_manage_comments',
      'instagram_business_content_publish',
      'instagram_business_manage_insights'
      
    ];

    const authUrl = new URL('https://www.instagram.com/oauth/authorize');
    authUrl.searchParams.set('client_id', process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID);
    authUrl.searchParams.set('redirect_uri', `${process.env.APP_BASE_URL || 'http://localhost:3000'}/api/instagram/direct-callback`);
    authUrl.searchParams.set('scope', scopes.join(','));
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('config_id', '598166200007510');
    console.log(authUrl.toString());
    return NextResponse.json({
      auth_url: authUrl.toString(),
      success: true
    });

  } catch (error) {
    console.error('Instagram direct auth error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate auth URL' },
      { status: 500 }
    );
  }
}