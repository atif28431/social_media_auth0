import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request) {
  try {
    const { code, user_id, redirect_uri } = await request.json();
    
    if (!code) {
      return new Response(JSON.stringify({ error: "Authorization code is required" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Use the redirect URI from the request body if provided, otherwise construct from headers
    const redirectUri = redirect_uri || `${request.headers.get('origin') || request.headers.get('referer')?.split('/').slice(0, 3).join('/') || 'http://localhost:3000'}/instagram-callback`;
    
    console.log('Instagram Graph API token exchange - All headers:', Object.fromEntries(request.headers.entries()));
    console.log('Instagram Graph API token exchange - Request body redirect_uri:', redirect_uri);
    console.log('Instagram Graph API token exchange - Final redirect URI:', redirectUri);
    console.log('Instagram Graph API token exchange - Code:', code);
    
    // Step 1: Exchange the code for a short-lived Facebook access token
    const tokenResponse = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_FACEBOOK_APP_ID,
        client_secret: process.env.FACEBOOK_APP_SECRET,
        redirect_uri: redirectUri,
        code,
      }).toString(),
    });
    
    const tokenData = await tokenResponse.json();
    console.log('Facebook token exchange response:', tokenData);
    console.log('Short-lived token expires_in:', tokenData.expires_in);
    
    if (!tokenResponse.ok || tokenData.error) {
      console.error('Facebook token exchange error:', tokenData);
      return new Response(JSON.stringify({ 
        error: tokenData.error_message || tokenData.error?.message || 'Failed to exchange token',
        details: tokenData
      }), {
        status: tokenResponse.status || 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Step 2: Get user's Instagram Business Account ID
    const meResponse = await fetch(
      `https://graph.facebook.com/v18.0/me?fields=id,name&access_token=${tokenData.access_token}`
    );
    
    const meData = await meResponse.json();
    console.log('Facebook user data:', meData);
    
    if (!meResponse.ok || meData.error) {
      console.error('Facebook user data error:', meData);
      return new Response(JSON.stringify({ 
        error: 'Failed to get user data',
        details: meData
      }), {
        status: meResponse.status || 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Step 3: Get Instagram Business Accounts connected to this Facebook user
    const accountsResponse = await fetch(
      `https://graph.facebook.com/v18.0/${meData.id}/accounts?fields=instagram_business_account,name,id&access_token=${tokenData.access_token}`
    );
    
    const accountsData = await accountsResponse.json();
    console.log('Facebook pages with Instagram accounts:', accountsData);
    
    if (!accountsResponse.ok || accountsData.error) {
      console.error('Facebook accounts error:', accountsData);
      return new Response(JSON.stringify({ 
        error: 'Failed to get Instagram business accounts',
        details: accountsData
      }), {
        status: accountsResponse.status || 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Find the first Instagram Business Account and get page details
    let instagramAccountId = null;
    let pageId = null;
    let pageName = null;
    let pageAccessToken = null;
    
    for (const page of accountsData.data || []) {
      if (page.instagram_business_account) {
        instagramAccountId = page.instagram_business_account.id;
        pageId = page.id;
        pageName = page.name;
        
        // Get page access token
        const pageTokenResponse = await fetch(
          `https://graph.facebook.com/v18.0/${page.id}?fields=access_token&access_token=${tokenData.access_token}`
        );
        const pageTokenData = await pageTokenResponse.json();
        pageAccessToken = pageTokenData.access_token || tokenData.access_token;
        break;
      }
    }
    
    if (!instagramAccountId) {
      return new Response(JSON.stringify({ 
        error: 'No Instagram Business Account found. Please ensure you have an Instagram Business Account connected to a Facebook Page.',
        details: accountsData
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Get Instagram account details
    const instagramResponse = await fetch(
      `https://graph.facebook.com/v18.0/${instagramAccountId}?fields=id,username,name,profile_picture_url&access_token=${pageAccessToken}`
    );
    
    const instagramData = await instagramResponse.json();
    console.log('Instagram account details:', instagramData);
    
    if (!instagramResponse.ok || instagramData.error) {
      console.error('Instagram account details error:', instagramData);
      return new Response(JSON.stringify({ 
        error: 'Failed to get Instagram account details',
        details: instagramData
      }), {
        status: instagramResponse.status || 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Step 4: Exchange for a long-lived token
    const longLivedTokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.NEXT_PUBLIC_FACEBOOK_APP_ID}&client_secret=${process.env.FACEBOOK_APP_SECRET}&fb_exchange_token=${tokenData.access_token}`
    );
    
    const longLivedTokenData = await longLivedTokenResponse.json();
    console.log('Long-lived token response:', longLivedTokenData);
    console.log('Long-lived token expires_in:', longLivedTokenData.expires_in);
    
    if (!longLivedTokenResponse.ok || longLivedTokenData.error) {
      console.error('Long-lived token error:', longLivedTokenData);
      // If long-lived token fails, we can still use the short-lived token
      console.log('Using short-lived token as fallback');
    }
    
    const finalAccessToken = longLivedTokenData.access_token || tokenData.access_token;
    let expiresIn = longLivedTokenData.expires_in || tokenData.expires_in || 3600; // Default 1 hour
    
    // Instagram access tokens typically last 60 days
    // If we got a short-lived token (< 24 hours), extend it to 60 days
    if (expiresIn < 86400) { // Less than 24 hours
      console.log(`Short-lived token detected (${expiresIn} seconds), extending to 60 days for Instagram`);
      expiresIn = 60 * 24 * 60 * 60; // 60 days in seconds
    }
    
    console.log('Final access token:', finalAccessToken ? finalAccessToken.substring(0, 10) + '...' : null);
    console.log('Raw expires_in from API:', longLivedTokenData.expires_in || tokenData.expires_in);
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
    // First delete existing Instagram accounts to avoid duplicates
    await supabase.from('instagram_accounts').delete().eq('user_id', user_id);
    
    // Then insert the new Instagram account
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
        access_token: pageAccessToken,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    
    if (instagramAccountError) {
      console.error('Error saving Instagram account:', instagramAccountError);
      // Don't fail the entire request, just log the error
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