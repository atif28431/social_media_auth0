import { NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js'; // Use the official Supabase client directly
import { jwtDecode } from "jwt-decode";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request) {
  try {
    const { access_token, user_id } = await request.json();
    console.log('📝 Storing Facebook token for user:', user_id);
    console.log('🔑 Token (first 20 chars):', access_token?.substring(0, 20)+ '...');

    if (!access_token) {
      return NextResponse.json(
        { error: "Access token is required" },
        { status: 400 }
      );
    }

    if (!user_id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Validate the token with Facebook
    const validateResponse = await fetch(
      `https://graph.facebook.com/me?access_token=${access_token}&fields=id,name`
    );
    const validateData = await validateResponse.json();

    if (validateData.error) {
      console.error("Facebook token validation error:", validateData.error);
      return NextResponse.json(
        { error: "Invalid Facebook token" },
        { status: 400 }
      );
    }

    // Exchange for long-lived token
    const exchangeResponse = await fetch(
      `https://graph.facebook.com/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.NEXT_PUBLIC_FACEBOOK_APP_ID}&client_secret=${process.env.FACEBOOK_APP_SECRET}&fb_exchange_token=${access_token}`
    );
    const exchangeData = await exchangeResponse.json();

    const longLivedToken = exchangeData.access_token || access_token;
    const expiresIn = exchangeData.expires_in || 5184000; // Default to 60 days

    // Create Supabase client with service role key for server-side operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Store the token in Supabase
    const expiresAt = new Date(Date.now() + expiresIn * 1000);
    const { error } = await supabase
      .from("user_sessions")
      .upsert(
        {
          user_id: user_id,
          facebook_access_token: longLivedToken,
          facebook_token_expires_at: expiresAt.toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (error) {
      console.error("Error storing Facebook token:", error);
      return NextResponse.json(
        { error: "Failed to store token" },
        { status: 500 }
      );
    }

    // Fetch user's Facebook pages
    const pagesResponse = await fetch(
      `https://graph.facebook.com/me/accounts?access_token=${longLivedToken}`
    );
    const pagesData = await pagesResponse.json();

    if (pagesData.data && pagesData.data.length > 0) {
      // Save pages to database
      const pagesForDb = pagesData.data.map((page) => ({
        user_id: user_id,
        page_id: page.id,
        page_name: page.name,
        access_token: page.access_token,
        category: page.category || null,
      }));

      // Insert only new pages to avoid duplicates
      const existingPages = await supabase
        .from('facebook_pages')
        .select('page_id')
        .eq('user_id', user_id);

      const existingPageIds = existingPages.data?.map(p => p.page_id) || [];
      const newPages = pagesForDb.filter(page => !existingPageIds.includes(page.page_id));

      if (newPages.length > 0) {
        const { error: pagesError } = await supabase
          .from("facebook_pages")
          .insert(newPages);

        if (pagesError) {
          console.error("Error saving Facebook pages:", pagesError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      access_token: longLivedToken,
      expires_in: expiresIn,
      user_info: validateData,
      pages_count: pagesData.data?.length || 0,
    });
  } catch (error) {
    console.error("Error processing Facebook token:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code) {
      return NextResponse.json(
        { error: "Authorization code is required" },
        { status: 400 }
      );
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v23.0/oauth/access_token?client_id=${process.env.NEXT_PUBLIC_FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(
        `${process.env.APP_BASE_URL || "http://localhost:3000"}/api/facebook/token`
      )}&client_secret=${process.env.FACEBOOK_APP_SECRET}&code=${code}`
    ); 

    const tokenData = await tokenResponse.json();
    
    console.log('🔍 Facebook token exchange response:', {
      hasAccessToken: !!tokenData.access_token,
      hasError: !!tokenData.error,
      errorMessage: tokenData.error?.message
    });

    if (tokenData.error) {
      console.error("Facebook token exchange error:", tokenData.error);
      return NextResponse.redirect(
        `${process.env.APP_BASE_URL || "http://localhost:3000"}/settings?error=facebook_auth_failed`
      );
    }

    // Get user info to extract user ID
    const userResponse = await fetch(
      `https://graph.facebook.com/me?access_token=${tokenData.access_token}&fields=id,name`
    );
    const userData = await userResponse.json();

    if (userData.error) {
      console.error("Facebook user info error:", userData.error);
      return NextResponse.redirect(
        `${process.env.APP_BASE_URL || "http://localhost:3000"}/settings?error=facebook_auth_failed`
      );
    }

    // Store the token (you might need to get the actual user_id from your auth system)
    // For now, we'll redirect to settings with the token in the URL
    return NextResponse.redirect(
      `${process.env.APP_BASE_URL || "http://localhost:3000"}/settings?facebook_token=${tokenData.access_token}&facebook_user_id=${userData.id}`
    );
  } catch (error) {
    console.error("Error in Facebook OAuth callback:", error);
    return NextResponse.redirect(
      `${process.env.APP_BASE_URL || "http://localhost:3000"}/settings?error=facebook_auth_failed`
    );
  }
}