import { auth0 } from '@/lib/auth0';

export async function GET(request) {
  try {
    return await auth0.handleAuth(request);
  } catch (error) {
    console.error('Auth error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function POST(request) {
  try {
    return await auth0.handleAuth(request);
  } catch (error) {
    console.error('Auth error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}