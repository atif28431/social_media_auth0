import { NextResponse } from "next/server";

export async function GET(request) {
  const { cookies } = request;
  const idToken = cookies.get("id_token");
  if (!idToken) {
    return NextResponse.json(null, { status: 200 });
  }
  // Optionally, decode the token to get user info
  // For now, just return a dummy user object
  return NextResponse.json(
    { email: "user@example.com", idToken },
    { status: 200 }
  );
}
