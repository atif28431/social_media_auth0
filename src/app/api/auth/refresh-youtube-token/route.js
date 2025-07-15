import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

/**
 * API endpoint to refresh YouTube access token
 * This endpoint uses the refresh token to get a new access token
 */
export async function POST(request) {
  try {
    // Get the refresh token from the request body
    const { refreshToken, userId } = await request.json();
    
    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      );
    }
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }
    
    // Exchange the refresh token for a new access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Error refreshing YouTube token:', errorData);
      return NextResponse.json(
        { error: 'Failed to refresh token', details: errorData },
        { status: tokenResponse.status }
      );
    }
    
    const tokenData = await tokenResponse.json();
    const { access_token, expires_in } = tokenData;
    
    // Calculate token expiry time (current time + expires_in seconds)
    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();
    
    // Create Supabase client with service role key for server-side operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Update the user_sessions table with the new access token
    const { error: sessionUpdateError } = await supabase
      .from('user_sessions')
      .update({
        youtube_access_token: access_token,
        youtube_token_expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);
    
    if (sessionUpdateError) {
      console.error('Error updating user session:', sessionUpdateError);
      return NextResponse.json(
        { error: 'Failed to update token in database', details: sessionUpdateError },
        { status: 500 }
      );
    }
    
    // Update the youtube_accounts table with the new access token
    const { error: accountUpdateError } = await supabase
      .from('youtube_accounts')
      .update({
        access_token: access_token,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);
    
    if (accountUpdateError) {
      console.error('Error updating YouTube account:', accountUpdateError);
      // Continue anyway, as we've already updated the user_sessions table
    }
    
    return NextResponse.json({
      access_token,
      expires_at: expiresAt,
    });
  } catch (error) {
    console.error('Error refreshing YouTube token:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred', details: error.message },
      { status: 500 }
    );
  }
}