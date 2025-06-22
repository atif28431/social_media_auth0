import { NextResponse } from "next/server";

export async function GET() {
  const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
  const AUTH0_CLIENT_ID = process.env.AUTH0_CLIENT_ID;
  const redirectUri = process.env.NEXTAUTH_URL;
  );
  const url = `https://${AUTH0_DOMAIN}/authorize?response_type=code&client_id=${AUTH0_CLIENT_ID}&redirect_uri=${redirectUri}&scope=openid%20profile%20email`;
  return NextResponse.redirect(url);
}
