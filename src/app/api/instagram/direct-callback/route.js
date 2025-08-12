import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const error_description = searchParams.get('error_description');

    if (error) {
      console.error('Instagram Direct OAuth error:', error, error_description);
      return new Response(
        `<script>window.opener.postMessage({error: "${error_description || error}"}, "*"); window.close();</script>`,
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    if (!code) {
      return new Response(
        '<script>window.opener.postMessage({error: "No authorization code received"}, "*"); window.close();</script>',
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    // In direct-auth, state is the user_id
    const user_id = state;

    // Exchange code for short-lived access token
    const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID,
        client_secret: process.env.INSTAGRAM_APP_SECRET,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.APP_BASE_URL || 'http://localhost:3000'}/api/instagram/direct-callback`,
        code: code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || tokenData.error) {
      console.error('Instagram token exchange error:', tokenData);
      return new Response(
        `<script>window.opener.postMessage({error: "${tokenData.error_message || 'Token exchange failed'}"}, "*"); window.close();</script>`,
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    // Exchange short-lived for long-lived token
    const longLivedResponse = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${process.env.INSTAGRAM_APP_SECRET}&access_token=${tokenData.access_token}`
    );
    const longLivedData = await longLivedResponse.json();

    if (!longLivedResponse.ok || longLivedData.error) {
      throw new Error(longLivedData.error_message || 'Failed to get long-lived token');
    }

    const finalAccessToken = longLivedData.access_token;
    const expiresIn = longLivedData.expires_in; // 60 days
    const expiryDate = new Date(Date.now() + expiresIn * 1000).toISOString();

    // Get user info from Instagram Basic Display API
    const userResponse = await fetch(
      `https://graph.instagram.com/me?fields=id,username,account_type&access_token=${finalAccessToken}`
    );
    const userData = await userResponse.json();

    if (!userResponse.ok || userData.error) {
      console.error('Instagram user info error:', userData);
      return new Response(
        '<script>window.opener.postMessage({error: "Failed to get user info"}, "*"); window.close();</script>',
        { headers: { 'Content-Type': 'text/html' } }
      );
    }

    // Save to database
    const supabase = createAdminClient();

    const accountData = {
      user_id: user_id,
      instagram_account_id: userData.id,
      username: userData.username,
      name: userData.username,
      profile_picture_url: null,
      page_id: userData.id,
      page_name: userData.username,
      access_token: finalAccessToken,
      connection_type: 'instagram_direct',
      instagram_direct_token: finalAccessToken,
      instagram_direct_token_expires_at: expiryDate,
      instagram_user_id: userData.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Upsert into instagram_accounts
    await supabase
      .from('instagram_accounts')
      .upsert(accountData, { onConflict: 'instagram_account_id,user_id' });

    // Upsert into user_sessions
    await supabase
      .from('user_sessions')
      .upsert({
        user_id: user_id,
        auth_provider: 'auth0',
        instagram_access_token: finalAccessToken,
        instagram_token_expires_at: expiryDate,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    // Send success message to parent window
    return new Response(
      `<script>
        window.opener.postMessage({
          success: true,
          account: ${JSON.stringify({
            instagram_account_id: userData.id,
            username: userData.username,
            name: userData.username,
            connection_type: 'instagram_direct',
          })}
        }, "*");
        window.close();
      </script>`,
      { headers: { 'Content-Type': 'text/html' } }
    );

  } catch (error) {
    console.error('Instagram direct callback error:', error);
    return new Response(
      `<script>window.opener.postMessage({error: "${error.message}"}, "*"); window.close();</script>`,
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
}