import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request) {
  try {
    // Get user_id from query params or headers
    const url = new URL(request.url);
    const userId = url.searchParams.get('user_id');
    
    if (!userId) {
      return new Response(JSON.stringify({ 
        error: 'user_id query parameter is required',
        example: '/api/debug/tokens?user_id=your_user_id'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const supabase = createAdminClient();
    
    // Get tokens from database
    const { data, error } = await supabase
      .from('user_sessions')
      .select('facebook_access_token, instagram_access_token, youtube_access_token, facebook_token_expires_at, instagram_token_expires_at, youtube_token_expires_at, updated_at')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error('Debug tokens error:', error);
      return new Response(JSON.stringify({ 
        error: 'Database error',
        details: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const now = new Date();
    
    const result = {
      user_id: userId,
      timestamp: now.toISOString(),
      tokens: {
        facebook: {
          present: !!data?.facebook_access_token,
          expires_at: data?.facebook_token_expires_at,
          expired: data?.facebook_token_expires_at ? now > new Date(data.facebook_token_expires_at) : null
        },
        instagram: {
          present: !!data?.instagram_access_token,
          expires_at: data?.instagram_token_expires_at,
          expired: data?.instagram_token_expires_at ? now > new Date(data.instagram_token_expires_at) : null
        },
        youtube: {
          present: !!data?.youtube_access_token,
          expires_at: data?.youtube_token_expires_at,
          expired: data?.youtube_token_expires_at ? now > new Date(data.youtube_token_expires_at) : null
        }
      },
      database_updated_at: data?.updated_at,
      raw_data: data
    };
    
    return new Response(JSON.stringify(result, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Debug API error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
