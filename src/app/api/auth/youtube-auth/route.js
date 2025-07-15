import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * API endpoint to handle YouTube OAuth authentication
 * This endpoint initiates the OAuth flow by redirecting to Google's authorization URL
 */
export async function GET(request) {
  try {
    // Get the redirect URI, return URL, and user ID from the request
    const { searchParams } = new URL(request.url);
    const redirectUri = searchParams.get('redirect_uri') || `${process.env.APP_BASE_URL}/api/auth/youtube-callback`;
    const returnUrl = searchParams.get('return');
    const userId = searchParams.get('user_id');
    
    console.log('YouTube auth initiated for user:', userId);
    
    // Google OAuth parameters
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const scope = 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly';
    
    // Construct the authorization URL
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', scope);
    authUrl.searchParams.append('access_type', 'offline');
    authUrl.searchParams.append('prompt', 'consent'); // Force to get refresh token
    
    // Generate a state parameter to prevent CSRF attacks
    // Include user ID in state for retrieval in callback
    const stateData = {
      random: Math.random().toString(36).substring(2, 15),
      userId: userId,
      return: returnUrl
    };
    const state = Buffer.from(JSON.stringify(stateData)).toString('base64');
    authUrl.searchParams.append('state', state);
    
    // Store the state in cookies for verification when the user returns
    const response = NextResponse.redirect(authUrl.toString());
    response.cookies.set('youtube_auth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 10, // 10 minutes
      path: '/',
    });
    
    return response;
  } catch (error) {
    console.error('Error initiating YouTube auth:', error);
    return NextResponse.json(
      { error: 'Failed to initiate YouTube authentication' },
      { status: 500 }
    );
  }
}