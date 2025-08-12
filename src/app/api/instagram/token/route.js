import { createAdminClient } from '@/lib/supabase/admin';




export async function POST(request) {
  try {
    const { code, user_id, redirect_uri, platform = 'facebook' } = await request.json();
    
    if (!code) {
      return new Response(JSON.stringify({ error: "Authorization code is required" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Use the redirect URI from the request body if provided, otherwise construct from headers
    const redirectUri = redirect_uri || `${request.headers.get('origin') || request.headers.get('referer')?.split('/').slice(0, 3).join('/') || 'http://localhost:3000'}/instagram-callback`;
    
    console.log('Instagram Graph API v18.0 token exchange - Platform:', platform);
    console.log('Instagram Graph API v18.0 token exchange - All headers:', Object.fromEntries(request.headers.entries()));
    console.log('Instagram Graph API v18.0 token exchange - Request body redirect_uri:', redirect_uri);
    console.log('Instagram Graph API v18.0 token exchange - Final redirect URI:', redirectUri);
    console.log('Instagram Graph API v18.0 token exchange - Code:', code);
    
    // New Instagram Login API Integration
    if (platform === 'instagram') {
      return handleInstagramLogin(code, redirectUri, user_id);
    }
    
    // Original Facebook Graph API Integration
    return handleFacebookLogin(code, redirectUri, user_id);
  } catch (error) {
    console.error('Token exchange error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(
      new URL(`/settings?instagram_error=${encodeURIComponent(error)}`, request.url)
    );
  }
  if (!code) {
    return NextResponse.redirect(
      new URL('/settings?instagram_error=missing_code', request.url)
    );
  }

  // TODO: exchange code → long-lived token → save DB → redirect
  return NextResponse.redirect(
    new URL('/settings?instagram_connected=true', request.url)
  );
}

async function handleInstagramLogin(code, redirectUri, user_id) {
  try {
    console.log('Using Instagram Basic Display API flow');
    
    // Step 1: Exchange authorization code for access token
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
        error: tokenData.error_message || tokenData.error?.message || 'Failed to exchange Instagram token',
        details: tokenData
      }), {
        status: tokenResponse.status || 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Step 2: Get user info
    const userResponse = await fetch(
      `https://graph.instagram.com/me?fields=id,username,account_type&access_token=${tokenData.access_token}`
    );
    
    const userData = await userResponse.json();
    console.log('Instagram user data:', userData);
    
    if (!userResponse.ok || userData.error) {
      console.error('Instagram user data error:', userData);
      return new Response(JSON.stringify({ 
        error: 'Failed to get Instagram user data',
        details: userData
      }), {
        status: userResponse.status || 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Note: Instagram Basic Display API tokens expire in 1 hour
    // For longer-lived access, users need to use Facebook Login
    const expiresIn = 3600; // 1 hour in seconds
    
    // Store the token in Supabase
    const supabase = createAdminClient();
    
    if (!user_id) {
      console.error('No user_id provided in request body');
      return new Response(JSON.stringify({ error: 'User ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Check if user_sessions record exists
    console.log('Checking if user_sessions record exists for user:', user_id);
    const { data: existingSession, error: selectError } = await supabase
      .from('user_sessions')
      .select('id, instagram_access_token')
      .eq('user_id', user_id)
      .single();
    
    console.log('Existing session query result:', { existingSession, selectError });
    
    let updateError;
    
    if (existingSession) {
      // Update existing record
      console.log('Updating existing user_sessions record with Instagram token');
      const expiryDate = new Date(Date.now() + expiresIn * 1000).toISOString();
      const updateData = {
        instagram_access_token: tokenData.access_token,
        instagram_token_expires_at: expiryDate,
        updated_at: new Date().toISOString(),
      };
      console.log('Update data:', updateData);
      
      const { error } = await supabase
        .from('user_sessions')
        .update(updateData)
        .eq('user_id', user_id);
      updateError = error;
      console.log('Update result:', { error });
    } else {
      // Insert new record
      console.log('Inserting new user_sessions record with Instagram token');
      const expiryDate = new Date(Date.now() + expiresIn * 1000).toISOString();
      const insertData = {
        user_id: user_id,
        auth_provider: 'auth0',
        instagram_access_token: tokenData.access_token,
        instagram_token_expires_at: expiryDate,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      console.log('Insert data:', insertData);
      
      const { error } = await supabase
        .from('user_sessions')
        .insert(insertData);
      updateError = error;
      console.log('Insert result:', { error });
    }
    
    if (updateError) {
      console.error('Supabase update error details:', {
        error: updateError,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        code: updateError.code
      });
      return new Response(JSON.stringify({ 
        error: 'Failed to store token',
        details: updateError.message || 'Unknown database error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Save Instagram account details to instagram_accounts table
    // Check if this Instagram account already exists for this user
    const { data: existingAccount } = await supabase
      .from('instagram_accounts')
      .select('id')
      .eq('user_id', user_id)
      .eq('instagram_account_id', userData.id)
      .single();
    
    if (!existingAccount) {
      // Only insert if this account doesn't already exist for this user
      const { error: instagramAccountError } = await supabase
        .from('instagram_accounts')
        .insert({
          user_id: user_id,
          instagram_account_id: userData.id,
          username: userData.username || '',
          name: userData.username || '',
          profile_picture_url: null,
          page_id: null,
          page_name: null,
          access_token: tokenData.access_token,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      
      if (instagramAccountError) {
        console.error('Error saving Instagram account:', instagramAccountError);
        // Don't fail the entire request, just log the error
      }
    } else {
      // Update existing account if it already exists
      const { error: updateAccountError } = await supabase
        .from('instagram_accounts')
        .update({
          username: userData.username || '',
          name: userData.username || '',
          profile_picture_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user_id)
        .eq('instagram_account_id', userData.id);
      
      if (updateAccountError) {
        console.error('Error updating Instagram account:', updateAccountError);
      }
    }
    
    console.log('Instagram token exchange completed successfully');
    console.log('Returning response with token:', tokenData.access_token ? 'present' : 'null');
    console.log('Instagram user ID:', userData.id);
    
    return new Response(JSON.stringify({ 
      access_token: tokenData.access_token,
      instagram_account_id: userData.id,
      expires_in: expiresIn,
      success: true,
      account_type: userData.account_type
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Instagram Basic Display API token exchange error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      cause: error.cause
    });
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error',
      type: error.name || 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function handleFacebookLogin(code, redirectUri, user_id) {
  try {
    console.log('Using Facebook Graph API flow');
    
    // Step 1: Exchange authorization code for access token
    const tokenResponse = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        redirect_uri: redirectUri,
        code,
        grant_type: 'authorization_code',
      }).toString(),
    });
    
    const tokenData = await tokenResponse.json();
    console.log('Facebook token exchange response:', tokenData);
    
    if (!tokenResponse.ok || tokenData.error) {
      console.error('Facebook token exchange error:', tokenData);
      return new Response(JSON.stringify({ 
        error: tokenData.error_description || tokenData.error?.message || 'Failed to exchange Facebook token',
        details: tokenData
      }), {
        status: tokenResponse.status || 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    // Step 2: Get user's Facebook pages
    const accountsResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token&access_token=${tokenData.access_token}`
    );
    
    const accountsData = await accountsResponse.json();
    console.log('Facebook pages data:', accountsData);
    
    if (!accountsResponse.ok || accountsData.error) {
      console.error('Facebook pages error:', accountsData);
      return new Response(JSON.stringify({ 
        error: 'Failed to get Facebook pages',
        details: accountsData
      }), {
        status: accountsResponse.status || 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Step 3: Find Instagram Business account for each page
    let instagramAccountId = null;
    let instagramData = null;
    let pageAccessToken = null;
    let pageId = null;
    let pageName = null;
    
    for (const page of accountsData.data || []) {
      try {
        const instagramResponse = await fetch(
          `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account{id,username,name,profile_picture_url,media_count}&access_token=${page.access_token}`
        );
        
        const instagramResult = await instagramResponse.json();
        console.log(`Instagram account for page ${page.name}:`, instagramResult);
        
        if (instagramResult.instagram_business_account) {
          instagramAccountId = instagramResult.instagram_business_account.id;
          instagramData = instagramResult.instagram_business_account;
          pageAccessToken = page.access_token;
          pageId = page.id;
          pageName = page.name;
          break;
        }
      } catch (error) {
        console.error(`Error checking Instagram account for page ${page.id}:`, error);
      }
    }
    
    if (!instagramAccountId) {
      return new Response(JSON.stringify({ 
        error: 'No Instagram Business account found',
        details: 'Please connect an Instagram Business account to your Facebook page'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Step 3: Get Instagram Business account for each page
    
    
    // Step 4: Exchange for long-lived token (60 days)
    const longLivedTokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.NEXT_PUBLIC_FACEBOOK_APP_ID}&client_secret=${process.env.FACEBOOK_APP_SECRET}&fb_exchange_token=${pageAccessToken}`
    );
    
    const longLivedTokenData = await longLivedTokenResponse.json();
    console.log('Facebook long-lived token response:', longLivedTokenData);
    
    const finalAccessToken = longLivedTokenData.access_token || pageAccessToken;
    let expiresIn = longLivedTokenData.expires_in || 5184000; // 60 days in seconds
    
    // Instagram access tokens typically last 60 days
    // If we got a short-lived token (< 24 hours), extend it to 60 days
    if (expiresIn < 86400) { // Less than 24 hours
      console.log(`Short-lived token detected (${expiresIn} seconds), extending to 60 days for Instagram`);
      expiresIn = 60 * 24 * 60 * 60; // 60 days in seconds
    }
    
    console.log('Final access token:', finalAccessToken ? finalAccessToken.substring(0, 10) + '...' : null);
    console.log('Raw expires_in from API:', longLivedTokenData.expires_in);
    console.log('Final expiresIn (seconds):', expiresIn);
    console.log('Final expiresIn (days):', Math.round(expiresIn / (24 * 60 * 60)));
    
    if (!expiresIn || expiresIn <= 0) {
      console.error('Invalid expires_in value received from Facebook/Instagram API:', expiresIn);
      expiresIn = 60 * 24 * 60 * 60; // Default to 60 days as fallback
      console.log('Using fallback expiresIn (60 days):', expiresIn);
    }
    
    // Store the token in Supabase using admin client (bypasses RLS)
    const supabase = createAdminClient();
    
    if (!user_id) {
      console.error('No user_id provided in request body');
      return new Response(JSON.stringify({ error: 'User ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Check if user_sessions record exists
    console.log('Checking if user_sessions record exists for user:', user_id);
    const { data: existingSession, error: selectError } = await supabase
      .from('user_sessions')
      .select('id, instagram_access_token')
      .eq('user_id', user_id)
      .single();
    
    console.log('Existing session query result:', { existingSession, selectError });
    
    let updateError;
    
    if (existingSession) {
      // Update existing record
      console.log('Updating existing user_sessions record with Instagram token');
      const expiryDate = new Date(Date.now() + expiresIn * 1000).toISOString();
      const updateData = {
        instagram_access_token: finalAccessToken,
        instagram_token_expires_at: expiryDate,
        updated_at: new Date().toISOString(),
      };
      console.log('Update data:', updateData);
      console.log('Token expires in seconds:', expiresIn);
      console.log('Token expires at:', expiryDate);
      
      const { error } = await supabase
        .from('user_sessions')
        .update(updateData)
        .eq('user_id', user_id);
      updateError = error;
      console.log('Update result:', { error });
    } else {
      // Insert new record
      console.log('Inserting new user_sessions record with Instagram token');
      const expiryDate = new Date(Date.now() + expiresIn * 1000).toISOString();
      const insertData = {
        user_id: user_id,
        auth_provider: 'auth0',
        instagram_access_token: finalAccessToken,
        instagram_token_expires_at: expiryDate,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      console.log('Insert data:', insertData);
      console.log('Token expires in seconds:', expiresIn);
      console.log('Token expires at:', expiryDate);
      
      const { error } = await supabase
        .from('user_sessions')
        .insert(insertData);
      updateError = error;
      console.log('Insert result:', { error });
    }
    
    if (updateError) {
      console.error('Supabase update error details:', {
        error: updateError,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        code: updateError.code
      });
      return new Response(JSON.stringify({ 
        error: 'Failed to store token',
        details: updateError.message || 'Unknown database error'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Save Instagram account details to instagram_accounts table
    // Check if this Instagram account already exists for this user
    const { data: existingAccount } = await supabase
      .from('instagram_accounts')
      .select('id')
      .eq('user_id', user_id)
      .eq('instagram_account_id', instagramAccountId)
      .single();
    
    if (!existingAccount) {
      // Only insert if this account doesn't already exist for this user
      const { error: instagramAccountError } = await supabase
        .from('instagram_accounts')
        .insert({
          user_id: user_id,
          instagram_account_id: instagramAccountId,
          username: instagramData.username || '',
          name: instagramData.name || '',
          profile_picture_url: instagramData.profile_picture_url || null,
          page_id: pageId,
          page_name: pageName,
          access_token: finalAccessToken,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      
      if (instagramAccountError) {
        console.error('Error saving Instagram account:', instagramAccountError);
        // Don't fail the entire request, just log the error
      }
    } else {
      // Update existing account if it already exists
      const { error: updateAccountError } = await supabase
        .from('instagram_accounts')
        .update({
          username: instagramData.username || '',
          name: instagramData.name || '',
          profile_picture_url: instagramData.profile_picture_url || null,
          page_name: pageName,
          access_token: finalAccessToken,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user_id)
        .eq('instagram_account_id', instagramAccountId);
      
      if (updateAccountError) {
        console.error('Error updating Instagram account:', updateAccountError);
      }
    }
    
    console.log('Instagram token exchange completed successfully');
    console.log('Returning response with token:', finalAccessToken ? 'present' : 'null');
    console.log('Instagram account ID:', instagramAccountId);
    
    return new Response(JSON.stringify({ 
      access_token: finalAccessToken,
      instagram_account_id: instagramAccountId,
      expires_in: expiresIn,
      success: true
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Instagram Graph API token exchange error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      cause: error.cause
    });
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error',
      type: error.name || 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}