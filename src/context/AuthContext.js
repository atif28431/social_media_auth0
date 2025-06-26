"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { createClient } from '@/lib/supabase/client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fbAccessToken, setFbAccessToken] = useState(null);
  const [instagramAccessToken, setInstagramAccessToken] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();
        
        if (data) {
          // Store user data in state
          setUser(data);
          
          // Store session info in Supabase user_sessions table
          const { error } = await supabase
            .from('user_sessions')
            .upsert({
              user_id: data.email, // Using email as user_id since we're using Auth0
              auth_provider: 'auth0',
              access_token: data.idToken,
              expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
              updated_at: new Date()
            }, { onConflict: 'user_id' });
            
          if (error) {
            console.error("Error storing session:", error);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Error checking user:", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [supabase]);

  // Check for Facebook and Instagram access tokens on mount
  useEffect(() => {
    if (!user) return;

    const fetchTokens = async () => {
      try {
        // Try to get tokens from Supabase first
        const { data, error } = await supabase
          .from("user_sessions")
          .select("facebook_access_token, instagram_access_token")
          .eq("user_id", user.email)
          .single();

        // Handle Facebook token
        if (data?.facebook_access_token) {
          console.log("Using Facebook token from Supabase");
          setFbAccessToken(data.facebook_access_token);
          // Also store in localStorage as backup
          localStorage.setItem("fb_access_token", data.facebook_access_token);
        } else {
          // Fall back to localStorage if not in Supabase
          const localFbToken = localStorage.getItem("fb_access_token");
          if (localFbToken) {
            console.log("Using Facebook token from localStorage");
            setFbAccessToken(localFbToken);
          }
        }

        // Handle Instagram token
        if (data?.instagram_access_token) {
          console.log("Using Instagram token from Supabase");
          setInstagramAccessToken(data.instagram_access_token);
          // Also store in localStorage as backup
          localStorage.setItem("ig_access_token", data.instagram_access_token);
        } else {
          // Fall back to localStorage if not in Supabase
          const localIgToken = localStorage.getItem("ig_access_token");
          if (localIgToken) {
            console.log("Using Instagram token from localStorage");
            setInstagramAccessToken(localIgToken);
          }
        }

        // Store tokens in Supabase for future use
        const tokensToUpsert = {
          user_id: user.email,
          auth_provider: "auth0", // or whatever provider you're using
          updated_at: new Date().toISOString(),
        };

        // Only add tokens that exist
        if (data?.facebook_access_token || localStorage.getItem("fb_access_token")) {
          tokensToUpsert.facebook_access_token = data?.facebook_access_token || localStorage.getItem("fb_access_token");
        }

        // Check for Instagram access token
        if (data?.instagram_access_token || localStorage.getItem("ig_access_token")) {
          tokensToUpsert.instagram_access_token = data?.instagram_access_token || localStorage.getItem("ig_access_token");
          // Also update the state
          setInstagramAccessToken(data?.instagram_access_token || localStorage.getItem("ig_access_token"));
        }

        // Only upsert if we have tokens to store
        if (tokensToUpsert.facebook_access_token || tokensToUpsert.instagram_access_token) {
          const { error: upsertError } = await supabase
            .from("user_sessions")
            .upsert(tokensToUpsert)
            .select();

          if (upsertError) {
            console.error("Error storing tokens in Supabase:", upsertError);
          }
        }
      } catch (error) {
        console.error("Error fetching tokens:", error);
      }
    };

    fetchTokens();
  }, [user, supabase]);

  const login = async (provider) => {
    try {
      window.location.href = "/api/auth/login";
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const logout = async () => {
    try {
      // Delete session from user_sessions table if user exists
      if (user && user.email) {
        await supabase
          .from('user_sessions')
          .delete()
          .eq('user_id', user.email);
      }
      
      // Then redirect to Auth0 logout
      window.location.href = "/api/auth/logout";
      
      // Clear local state
      setUser(null);
      setFbAccessToken(null);
      
      // Clear localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem("fb_access_token");
        localStorage.clear(); // Clear all localStorage items
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    accessToken: fbAccessToken,
    instagramAccessToken: instagramAccessToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
