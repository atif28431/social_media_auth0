import { NextResponse } from "next/server";

export async function GET(request) {
  const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
  // Always redirect to /logged-out after Auth0 logout
  const baseUrl = process.env.APP_BASE_URL || process.env.AUTH0_BASE_URL || "http://localhost:3000";
  const redirectUri = encodeURIComponent(
    `${baseUrl.replace(/\/$/, "")}/logged-out`
  );
  const url = `https://${AUTH0_DOMAIN}/v2/logout?client_id=${process.env.AUTH0_CLIENT_ID}&returnTo=${redirectUri}`;

  console.log('Logout redirect URL:', url);
  console.log('Base URL:', baseUrl);
  console.log('Redirect URI:', redirectUri);

  // Clear cookies by setting them to empty and expired
  const response = NextResponse.redirect(url);
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
  // Add any other cookies you use for auth/session here

  return response;
}
