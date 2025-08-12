import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return Response.json({ error: 'user_id is required' }, { status: 400 });
    }

    // Fetch Instagram accounts from database
    const { data: accounts, error } = await supabase
      .from('instagram_accounts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching Instagram accounts:', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Format the accounts to match expected structure
    const formattedAccounts = accounts.map(account => ({
      id: account.instagram_account_id,
      instagram_account_id: account.instagram_account_id,
      username: account.username,
      name: account.name,
      profile_picture_url: account.profile_picture_url,
      is_primary: account.is_primary,
      connection_type: account.connection_type || 'facebook', // Default to facebook for backward compatibility
      created_at: account.created_at
    }));

    return Response.json({ accounts: formattedAccounts });
  } catch (error) {
    console.error('Unexpected error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}