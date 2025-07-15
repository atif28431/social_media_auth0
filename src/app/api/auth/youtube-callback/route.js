import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cookies } from 'next/headers';

/**
 * API endpoint to handle YouTube OAuth callback
 * This endpoint exchanges the authorization code for access and refresh tokens
 * and stores them in the database
 */
export async function GET(request) {
  try {
    // Get the authorization code and state from the request
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    
    // Check if there was an error in the OAuth process
    if (error) {
      console.error('YouTube OAuth error:', error);
      return NextResponse.redirect(`${process.env.APP_BASE_URL}/youtube?error=${encodeURIComponent(error)}`);
    }
    
    // Verify the state parameter to prevent CSRF attacks and get user info
    const cookieStore = await cookies();
    const storedState = cookieStore.get('youtube_auth_state')?.value;
    
    if (!storedState || state !== storedState) {
      console.error('Invalid state parameter');
      return NextResponse.redirect(`${process.env.APP_BASE_URL}/youtube?error=${encodeURIComponent('Invalid state parameter')}`);
    }
    
    // Decode the state parameter to get user ID and return URL
    let stateData;
    try {
      stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      console.log('Decoded state data:', stateData);
    } catch (error) {
      console.error('Error decoding state:', error);
      return NextResponse.redirect(`${process.env.APP_BASE_URL}/youtube?error=${encodeURIComponent('Invalid state format')}`);
    }
    
    const userId = stateData.userId;
    const returnUrl = stateData.return;
    
    if (!userId) {
      console.error('No user ID found in state parameter');
      return NextResponse.redirect(`${process.env.APP_BASE_URL}/login?error=${encodeURIComponent('User ID not found. Please try again.')}`);
    }
    
    console.log('YouTube callback for user:', userId);
    
    // Exchange the authorization code for access and refresh tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${process.env.APP_BASE_URL}/api/auth/youtube-callback`,
        grant_type: 'authorization_code',
      }),
    });
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Error exchanging code for tokens:', errorData);
      return NextResponse.redirect(`${process.env.APP_BASE_URL}/youtube?error=${encodeURIComponent('Failed to exchange code for tokens')}`);
    }
    
    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokenData;
    
    // Calculate token expiry time (current time + expires_in seconds)
    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();
    
    // Get user information from the YouTube API
    const userResponse = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true',
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );
    
    if (!userResponse.ok) {
      const errorData = await userResponse.json();
      console.error('Error fetching YouTube user data:', errorData);
      return NextResponse.redirect(`${process.env.APP_BASE_URL}/youtube?error=${encodeURIComponent('Failed to fetch YouTube user data')}`);
    }
    
    const userData = await userResponse.json();
    const channel = userData.items[0];
    
    // Create Supabase client for server-side operations
    const supabase = createAdminClient();
    
    console.log('Storing YouTube tokens for user:', userId);
    
    // Update the user_sessions table with YouTube tokens
    const { error: sessionUpdateError } = await supabase
      .from('user_sessions')
      .upsert({
        user_id: userId,
        youtube_access_token: access_token,
        youtube_refresh_token: refresh_token,
        youtube_token_expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    
    if (sessionUpdateError) {
      console.error('Error updating user session:', sessionUpdateError);
      return NextResponse.redirect(`${process.env.APP_BASE_URL}/youtube?error=${encodeURIComponent('Failed to store YouTube tokens')}`);
    }
    
    // Insert the YouTube channel into the youtube_accounts table
    if (!channel) {
      console.warn('No YouTube channel found for this account');
      return NextResponse.redirect(`${process.env.APP_BASE_URL}/youtube?error=${encodeURIComponent('No YouTube channel found for this account')}`);
    }
    
    console.log('Session updated successfully');
    
    // Insert the YouTube channel into the youtube_accounts table
    // First, let's try to insert with the unique constraint on youtube_channel_id
    const { data: existingChannel, error: checkError } = await supabase
      .from('youtube_accounts')
      .select('id, user_id')
      .eq('youtube_channel_id', channel.id)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing channel:', checkError);
    }
    
    let channelInsertError = null;
    
    if (existingChannel) {
      // Channel exists, update it
      const { error: updateError } = await supabase
        .from('youtube_accounts')
        .update({
          user_id: userId,
          channel_name: channel.snippet.title,
          channel_description: channel.snippet.description,
          profile_picture_url: channel.snippet.thumbnails?.default?.url,
          access_token: access_token,
          refresh_token: refresh_token,
          token_expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq('youtube_channel_id', channel.id);
      
      channelInsertError = updateError;
      if (!updateError) {
        console.log('YouTube channel updated successfully');
      }
    } else {
      // Channel doesn't exist, insert it
      const { error: insertError } = await supabase
        .from('youtube_accounts')
        .insert({
          user_id: userId,
          youtube_channel_id: channel.id,
          channel_name: channel.snippet.title,
          channel_description: channel.snippet.description,
          profile_picture_url: channel.snippet.thumbnails?.default?.url,
          access_token: access_token,
          refresh_token: refresh_token,
          token_expires_at: expiresAt,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      
      channelInsertError = insertError;
      if (!insertError) {
        console.log('YouTube channel inserted successfully');
      }
    }
    
    if (channelInsertError) {
      console.error('Error inserting/updating YouTube channel:', channelInsertError);
      // Continue anyway, as we've already stored the tokens
      console.log('Continuing despite channel insert/update error...');
    }
    
    // Check if there's a return parameter to determine where to redirect
    let redirectUrl = `${process.env.APP_BASE_URL}/youtube?success=true`;
    
    if (returnUrl === 'settings') {
      redirectUrl = `${process.env.APP_BASE_URL}/settings?youtube_connected=true`;
    }
    
    console.log('Redirecting to:', redirectUrl);
    
    // Clear the state cookie
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set('youtube_auth_state', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 0,
      path: '/',
    });
    
    return response;
  } catch (error) {
    console.error('Error handling YouTube callback:', error);
    return NextResponse.redirect(`${process.env.APP_BASE_URL}/youtube?error=${encodeURIComponent('An unexpected error occurred')}`);
  }
}
