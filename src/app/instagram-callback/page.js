"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function InstagramCallback() {
  const router = useRouter();
  const { user, refreshTokensFromDatabase } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const hasProcessed = useRef(false);

  useEffect(() => {
    const handleInstagramCallback = async () => {
      if (typeof window !== "undefined" && user?.id && !isProcessing && !hasProcessed.current) {
        hasProcessed.current = true;
        console.log("Instagram callback - Full URL:", window.location.href);
        console.log("Instagram callback - Origin:", window.location.origin);
        console.log("Instagram callback - Pathname:", window.location.pathname);
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");
        const error = urlParams.get("error");
        const state = urlParams.get("state");
        
        console.log("Instagram callback - Code:", code);
        console.log("Instagram callback - Error:", error);
        console.log("Instagram callback - State:", state);
        // Verify state parameter
        const storedState = localStorage.getItem("instagram_state");
        if (state !== storedState) {
          console.error("State mismatch in Instagram callback");
          toast.error("Instagram authentication failed: Invalid state");
          router.replace("/settings");
          return;
        }

        if (error) {
          console.error("Instagram authorization error:", error);
          toast.error("Instagram authentication failed: " + error);
          router.replace("/settings");
          return;
        }

        if (code) {
          setIsProcessing(true);
          console.log("Instagram authorization code received:", code);
          
          try {
            // Exchange code for access token
            const redirectUri = `${window.location.origin}/instagram-callback`;
            console.log('Instagram callback - Sending redirect URI:', redirectUri);
            
            const response = await fetch('/api/instagram/token', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                code: code,
                user_id: user.id,
                redirect_uri: redirectUri,
              }),
            });

            const data = await response.json();

            if (data.access_token) {
              toast.success('Instagram account connected successfully!');
              // Clean up localStorage
              localStorage.removeItem("instagram_state");
              
              // Immediately refresh tokens in AuthContext
              console.log('Instagram connected - refreshing AuthContext tokens...');
              if (refreshTokensFromDatabase) {
                await refreshTokensFromDatabase();
                console.log('AuthContext tokens refreshed after Instagram connection');
              }
              
              // Small delay to ensure state is updated, then redirect
              setTimeout(() => {
                router.replace("/settings?instagram_connected=true");
              }, 500);
            } else {
              console.error('Instagram token exchange failed:', data);
              toast.error(data.error || 'Failed to connect Instagram account');
              router.replace("/settings");
            }
          } catch (error) {
            console.error('Error exchanging Instagram code:', error);
            toast.error('Failed to connect Instagram account');
            router.replace("/settings");
          } finally {
            setIsProcessing(false);
          }
        } else {
          // If no code or error found, redirect to settings after a delay
          const timer = setTimeout(() => {
            router.push("/settings");
          }, 2000);
          return () => clearTimeout(timer);
        }
      }
    };

    handleInstagramCallback();
  }, [router, user?.id]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">Connecting Instagram...</h1>
      <p className="mb-6 text-center">
        Please wait while we connect your Instagram account.
      </p>
      <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}
