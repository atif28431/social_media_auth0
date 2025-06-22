import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request) {
  const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
  // Redirect to a /logged-out page after Auth0 logout
  const redirectUri = encodeURIComponent(
    process.env.NEXTAUTH_URL
      ? process.env.NEXTAUTH_URL + "/logged-out"
      : "http://localhost:3000/logged-out"
  );
  const url = `https://${AUTH0_DOMAIN}/v2/logout?client_id=${process.env.AUTH0_CLIENT_ID}&returnTo=${redirectUri}`;

  // Create Supabase client and sign out to clear Supabase session
  const supabase = createClient();
  await supabase.auth.signOut();

  // Clear cookies by setting them to empty and expired
  const response = NextResponse.redirect(url);
  
  // Clear Auth0 cookies
  response.headers.append(
    "Set-Cookie",
    "auth-token=; Path=/; HttpOnly; Max-Age=0"
  );
  response.headers.append(
    "Set-Cookie",
    "next-auth.session-token=; Path=/; HttpOnly; Max-Age=0"
  );
  response.headers.append(
    "Set-Cookie",
    "next-auth.csrf-token=; Path=/; HttpOnly; Max-Age=0"
  );
  
  // Clear Supabase cookies
  response.headers.append(
    "Set-Cookie",
    "sb-access-token=; Path=/; HttpOnly; Max-Age=0"
  );
  response.headers.append(
    "Set-Cookie",
    "sb-refresh-token=; Path=/; HttpOnly; Max-Age=0"
  );
  response.headers.append(
    "Set-Cookie",
    "supabase-auth-token=; Path=/; HttpOnly; Max-Age=0"
  );

  return response;
}
