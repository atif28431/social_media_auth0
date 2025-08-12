import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const instagramAccountId = searchParams.get('instagram_account_id');

    if (!userId || !instagramAccountId) {
      return Response.json({ error: 'user_id and instagram_account_id are required' }, { status: 400 });
    }

    // Fetch the Instagram account details from database
    const { data: instagramAccount } = await supabase
      .from('instagram_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('instagram_account_id', instagramAccountId)
      .single();

    if (!instagramAccount) {
      console.error('Error fetching Instagram account:', error);
      return Response.json({ error: 'Instagram account not found' }, { status: 404 });
    }

    // Check connection type and return appropriate data
    if (instagramAccount.connection_type === 'instagram_direct') {
      return Response.json({
        connectionType: 'instagram_direct',
        instagramDirectToken: instagramAccount.instagram_direct_token,
        instagramAccountId: instagramAccount.instagram_account_id,
        instagramUserId: instagramAccount.instagram_user_id,
        username: instagramAccount.username,
        success: true,
        note: 'Instagram Basic Display API - Limited posting capabilities. Use for personal accounts only.'
      });
    } else {
      // Facebook-connected account (default)
      return Response.json({
        connectionType: 'facebook',
        pageAccessToken: instagramAccount.access_token,
        instagramAccountId: instagramAccount.instagram_account_id,
        facebookPageId: instagramAccount.page_id,
        username: instagramAccount.username,
        success: true,
        note: 'Facebook Graph API - Full posting capabilities for business accounts'
      });
    }

  } catch (error) {
    console.error('Unexpected error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}