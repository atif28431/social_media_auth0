'use client';

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Facebook, Instagram } from "lucide-react";

export default function Navbar() {
  const { isAuthenticated, fbAccessToken, instagramAccessToken, handleLogout } = useAuth();

  const connectFacebook = () => {
    const appId = process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID;
    const redirectUri = `${window.location.origin}/facebook-callback`;
    const scope =
      "pages_show_list,pages_manage_posts,pages_read_engagement,pages_read_user_content,public_profile,email";
    window.location.href = `https://www.instagram.com/oauth/authorize?force_reauth=true&client_id=${appId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=${scope}&response_type=token&auth_type=rerequest`;
  };

  const connectInstagram = () => {
    // IMPORTANT: Make sure this is the Instagram App ID, not the Facebook App ID
    // You can find this in the Facebook Developer Console under
    // Instagram Basic Display > Basic Display > Instagram App ID
    const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
    const redirectUri = `${window.location.origin}/instagram-callback`;
    const scope = "nstagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement";
    
    // Log the Instagram App ID for debugging
    console.log("Using Instagram App ID:", appId);
    console.log("Redirect URI:", redirectUri);
    
    // Construct the authorization URL
    const authUrl = `https://www.instagram.com/oauth/authorize?force_reauth=true&client_id=${appId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&scope=${scope}&response_type=code`;
    
    console.log("Instagram authorization URL:", authUrl);
    
    // Display alert with debugging info
    alert(
      "Debug Info:\n" +
      "Instagram App ID: " + appId + "\n" +
      "Redirect URI: " + redirectUri + "\n\n" +
      "Make sure:\n" +
      "1. You're using the Instagram App ID (not Facebook App ID)\n" +
      "2. The redirect URI is configured in the app settings\n" +
      "3. You're logged in with a test user account\n" +
      "4. The test user has been properly added to the app"
    );
    
    // Redirect to the Instagram authorization page
    // Add state parameter generation
    const state = crypto.randomUUID();
    localStorage.setItem('instagram_state', state);
    
    window.location.href = `https://www.instagram.com/oauth/authorize?${new URLSearchParams({
      client_id: appId,
      redirect_uri: encodeURIComponent(redirectUri),
      scope: 'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement',
      response_type: 'code',
      state: state // Add state parameter
    })}`;
  };

  return (
    <nav className="bg-background border-b sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link href="/" className="font-bold text-xl">
          Social Poster
        </Link>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              {!fbAccessToken && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={connectFacebook}
                  className="flex items-center gap-2"
                >
                  <Facebook className="h-4 w-4 text-blue-600" />
                  Connect Facebook
                </Button>
              )}
              {!instagramAccessToken && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={connectInstagram}
                  className="flex items-center gap-2"
                >
                  <Instagram className="h-4 w-4 text-pink-600" />
                  Connect Instagram
                </Button>
              )}
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  Dashboard
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <Link href="/login">
              <Button size="sm">Login</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}