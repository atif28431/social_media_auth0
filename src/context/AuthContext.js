"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [supabase, setSupabase] = useState(null);
  const [fbAccessToken, setFbAccessToken] = useState(null);
  const [instagramAccessToken, setInstagramAccessToken] = useState(null);
  const [tokenError, setTokenError] = useState(null);

  // Initialize user and supabase client
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();

        if (data?.idToken) {
          // Extract token value
          const token = data.idToken.value || data.idToken;
          
          // Decode JWT to get user info
          const decoded = jwtDecode(token);
          const userId = decoded.sub;
          console.log("Auth0 User ID:", userId);
          // Set user data
          setUser({ ...data, id: userId, idToken: token });
          
          // Create Supabase client with Auth0 JWT
          const supabaseClient = createClient(token);
          setSupabase(supabaseClient);
          
          // Store session in Supabase
          try {
            const { error } = await supabaseClient.from("user_sessions").upsert(
              {
                user_id: userId,
                auth_provider: "auth0",
                access_token: token,
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                updated_at: new Date().toISOString(),
              },
              { onConflict: "user_id" }
            );
            
            if (error) {
              console.error("Error storing session:", error);
            } else {
              console.log("Session stored successfully for user:", userId);
            }
          } catch (sessionError) {
            console.error("Session storage error:", sessionError);
          }
        } else {
          setUser(null);
          setSupabase(createClient()); // Create client without token
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        setUser(null);
        setSupabase(createClient());
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Function to check if token is expired
  const isTokenExpired = (token, expiresAt) => {
    if (!token) return true;
    if (!expiresAt) return false; // If no expiry date, assume it's valid
    
    const now = new Date();
    const expiry = new Date(expiresAt);
    return now >= expiry;
  };

  // Function to validate Facebook token
  const validateFacebookToken = async (token) => {
    try {
      const response = await fetch(
        `https://graph.facebook.com/me?access_token=${token}&fields=id,name`
      );
      const data = await response.json();
      
      if (data.error) {
        console.error("Facebook token validation error:", data.error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("Error validating Facebook token:", error);
      return false;
    }
  };

  // Function to clear expired tokens
  const clearExpiredTokens = async () => {
    if (!user?.id || !supabase) return;

    try {
      await supabase
        .from("user_sessions")
        .update({
          facebook_access_token: null,
          instagram_access_token: null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      // Clear from localStorage
      localStorage.removeItem("fb_access_token");
      localStorage.removeItem("ig_access_token");
      
      // Clear state
      setFbAccessToken(null);
      setInstagramAccessToken(null);
      setTokenError("Your social media tokens have expired. Please reconnect your accounts.");
    } catch (error) {
      console.error("Error clearing expired tokens:", error);
    }
  };

  // Fetch social media tokens
  useEffect(() => {
    if (!user?.id || !supabase) return;

    const fetchTokens = async () => {
      try {
        console.log("Fetching tokens for user:", user.id);
        // Get tokens from Supabase
        const { data, error } = await supabase
          .from("user_sessions")
          .select("facebook_access_token, instagram_access_token, facebook_token_expires_at, instagram_token_expires_at")
          .eq("user_id", user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error("Error fetching tokens:", error);
          return;
        }

        // Handle Facebook token
        if (data?.facebook_access_token) {
          // Check if token is expired
          if (isTokenExpired(data.facebook_access_token, data.facebook_token_expires_at)) {
            console.log("Facebook token is expired, clearing...");
            await clearExpiredTokens();
            return;
          }

          // Validate token with Facebook API
          const isValid = await validateFacebookToken(data.facebook_access_token);
          if (!isValid) {
            console.log("Facebook token is invalid, clearing...");
            await clearExpiredTokens();
            return;
          }

          setFbAccessToken(data.facebook_access_token);
          localStorage.setItem("fb_access_token", data.facebook_access_token);
          setTokenError(null); // Clear any previous errors
        } else {
          // Fall back to localStorage
          const localFbToken = localStorage.getItem("fb_access_token");
          if (localFbToken) {
            // Validate local token
            const isValid = await validateFacebookToken(localFbToken);
            if (isValid) {
              setFbAccessToken(localFbToken);
              // Store in Supabase for future use
              await updateTokensInSupabase({ facebook_access_token: localFbToken });
            } else {
              // Clear invalid local token
              localStorage.removeItem("fb_access_token");
              setTokenError("Your Facebook token has expired. Please reconnect your account.");
            }
          }
        }

        // Handle Instagram token (similar logic)
        if (data?.instagram_access_token) {
          if (isTokenExpired(data.instagram_access_token, data.instagram_token_expires_at)) {
            console.log("Instagram token is expired, clearing...");
            // Clear just Instagram token
            await supabase
              .from("user_sessions")
              .update({
                instagram_access_token: null,
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", user.id);
            localStorage.removeItem("ig_access_token");
            return;
          }

          setInstagramAccessToken(data.instagram_access_token);
          localStorage.setItem("ig_access_token", data.instagram_access_token);
        } else {
          // Fall back to localStorage
          const localIgToken = localStorage.getItem("ig_access_token");
          if (localIgToken) {
            setInstagramAccessToken(localIgToken);
            // Store in Supabase for future use
            await updateTokensInSupabase({ instagram_access_token: localIgToken });
          }
        }
      } catch (error) {
        console.error("Error fetching tokens:", error);
        setTokenError("Error loading your social media connections. Please try reconnecting.");
      }
    };

    fetchTokens();
  }, [user, supabase]);

  // Helper function to update tokens in Supabase
  const updateTokensInSupabase = async (tokens) => {
    if (!user?.id || !supabase) return;

    try {
      const updateData = {
        ...tokens,
        updated_at: new Date().toISOString(),
      };

      // Add expiry dates if tokens are provided
      if (tokens.facebook_access_token) {
        // Facebook short-lived tokens expire in 1 hour, long-lived in 60 days
        updateData.facebook_token_expires_at = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
      }

      if (tokens.instagram_access_token) {
        // Instagram tokens typically expire in 60 days
        updateData.instagram_token_expires_at = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
      }

      const { error } = await supabase
        .from("user_sessions")
        .update(updateData)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error updating tokens:", error);
      } else {
        console.log("Tokens updated successfully");
        setTokenError(null); // Clear any previous errors
      }
    } catch (error) {
      console.error("Error updating tokens:", error);
    }
  };

  // Function to refresh Facebook token (you'll need to implement the refresh endpoint)
  const refreshFacebookToken = async () => {
    try {
      const response = await fetch('/api/auth/refresh-facebook-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id })
      });

      const data = await response.json();
      if (data.access_token) {
        setFbAccessToken(data.access_token);
        localStorage.setItem("fb_access_token", data.access_token);
        await updateTokensInSupabase({ facebook_access_token: data.access_token });
        setTokenError(null);
        return true;
      }
    } catch (error) {
      console.error("Error refreshing Facebook token:", error);
    }
    return false;
  };

  const login = async (provider) => {
    try {
      window.location.href = "/api/auth/login";
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const logout = async () => {
    try {
      // Delete session from Supabase if user exists
      if (user?.id && supabase) {
        await supabase.from("user_sessions").delete().eq("user_id", user.id);
      }

      // Clear local state
      setUser(null);
      setFbAccessToken(null);
      setInstagramAccessToken(null);
      setSupabase(null);
      setTokenError(null);

      // Clear localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem("fb_access_token");
        localStorage.removeItem("ig_access_token");
      }

      // Redirect to Auth0 logout
      window.location.href = "/api/auth/logout";
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
    supabase, // Expose supabase client
    tokenError, // Expose token error state
    refreshFacebookToken, // Expose refresh function
    clearExpiredTokens, // Expose clear function
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