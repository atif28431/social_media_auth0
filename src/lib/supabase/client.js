import { createBrowserClient } from "@supabase/ssr";

export const createClient = (userId = null) => {
  const headers = {};
  
  // Pass Auth0 user ID as custom header for RLS
  if (userId) {
    headers['x-user-id'] = userId;
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        headers,
      },
    }
  );
};
