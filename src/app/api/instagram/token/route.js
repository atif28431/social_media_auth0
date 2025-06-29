import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const { code } = await request.json();
    
    if (!code) {
      return new Response(JSON.stringify({ error: "Authorization code is required" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Get the redirect URI from the environment or construct it
    const redirectUri = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/instagram-callback`;
    console.log('Instagram token exchange - Redirect URI:', redirectUri);
    console.log('Instagram token exchange - Code:', code);
    
    // Exchange the code for an access token
    const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID,
        client_secret: process.env.INSTAGRAM_APP_SECRET,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
        code,
      }).toString(),
    });
    
    const tokenData = await tokenResponse.json();
    console.log('Instagram token exchange response:', tokenData);
    
    if (!tokenResponse.ok || tokenData.error) {
      console.error('Instagram token exchange error:', tokenData);
      return new Response(JSON.stringify({ 
        error: tokenData.error_message || tokenData.error_description || 'Failed to exchange token',
        details: tokenData
      }), {
        status: tokenResponse.status || 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Get a long-lived token
    const longLivedTokenResponse = await fetch(
      `https://graph.facebook.com/oauth/access_token?grant_type=fb_exchange_token&client_secret=${process.env.INSTAGRAM_APP_SECRET}&access_token=${tokenData.access_token}`
    );
    
    const longLivedTokenData = await longLivedTokenResponse.json();
    console.log('Instagram long-lived token response:', longLivedTokenData);
    
    if (!longLivedTokenResponse.ok || longLivedTokenData.error) {
      console.error('Instagram long-lived token error:', longLivedTokenData);
      return new Response(JSON.stringify({ 
        error: 'Failed to get long-lived token',
        details: longLivedTokenData
      }), {
        status: longLivedTokenResponse.status || 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Store the token in Supabase
    const cookieStore = cookies();
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not authenticated' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Update the user's Instagram access token
    const { error: updateError } = await supabase
      .from('user_social_accounts')
      .upsert({
        user_id: user.id,
        instagram_access_token: longLivedTokenData.access_token,
        instagram_token_expires_at: new Date(Date.now() + longLivedTokenData.expires_in * 1000).toISOString(),
      });
    
    if (updateError) {
      console.error('Supabase update error:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to store token' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({ access_token: longLivedTokenData.access_token }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Instagram token exchange error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}