"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from '@auth0/nextjs-auth0';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const { user: auth0User, error, isLoading } = useUser();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [supabase, setSupabase] = useState(null);
  const [fbAccessToken, setFbAccessToken] = useState(null);
  const [instagramAccessToken, setInstagramAccessToken] = useState(null);
  const [youtubeAccessToken, setYoutubeAccessToken] = useState(null);
  const [youtubeRefreshToken, setYoutubeRefreshToken] = useState(null);
  const [tokenError, setTokenError] = useState(null);

  // Initialize user and supabase client
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (auth0User) {
          console.log("Auth0 User:", auth0User);
          console.log("User ID:", auth0User.sub);
          console.log("User Email:", auth0User.email);
          console.log("User Name:", auth0User.name);
          
          // Set user data with all available Auth0 profile info
          setUser({ 
            ...auth0User, 
            id: auth0User.sub
          });
          
          // Create Supabase client with Auth0 user ID
          const supabaseClient = createClient(auth0User.sub);
          setSupabase(supabaseClient);
          console.log('Created Supabase client with user ID:', auth0User.sub);
          
          // Store session in Supabase
          try {
            const { error } = await supabaseClient.from("user_sessions").upsert(
              {
                user_id: auth0User.sub,
                auth_provider: "auth0",
                expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                updated_at: new Date().toISOString(),
              },
              { onConflict: "user_id" }
            );
            
            if (error) {
              console.error("Error storing session:", error);
            } else {
              console.log("Session stored successfully for user:", auth0User.sub);
            }
          } catch (sessionError) {
            console.error("Session storage error:", sessionError);
          }
        } else {
          setUser(null);
          setSupabase(createClient()); // Create client without user ID
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        setUser(null);
        setSupabase(createClient());
      } finally {
        setLoading(false);
      }
    };

    if (!isLoading) {
      initializeAuth();
    }
  }, [auth0User, isLoading]);

  // Function to check if token is expired
  const isTokenExpired = (token, expiresAt) => {
    if (!token) return true;
    if (!expiresAt) return false; // If no expiry date, assume it's valid
    
    const now = new Date();
    const expiry = new Date(expiresAt);
    const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
    const isExpired = now >= (expiry.getTime() - bufferTime);
    return isExpired;
  };

  // Function to validate Facebook token
  const validateFacebookToken = async (token) => {
    try {
      const response = await fetch(
        `https://graph.facebook.com/me?access_token=${token}&fields=id,name`
      );
      
      if (!response.ok) {
        console.error("Facebook token validation failed:", response.status);
        return false;
      }
      
      const data = await response.json();
      
      if (data.error) {
        console.error("Facebook token validation error:", data.error);
        return false;
      }
      
      console.log("Facebook token validated successfully for user:", data.name);
      return true;
    } catch (error) {
      console.error("Error validating Facebook token:", error);
      // Don't fail validation on network errors - assume token is valid
      return true;
    }
  };

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
        const sixtyDaysInMs = 60 * 24 * 60 * 60 * 1000;
        const expiryDate = new Date(Date.now() + sixtyDaysInMs);
        updateData.instagram_token_expires_at = expiryDate.toISOString();
      }
      
      if (tokens.youtube_access_token) {
        // YouTube access tokens typically expire in 1 hour
        const oneHourInMs = 60 * 60 * 1000;
        const expiryDate = new Date(Date.now() + oneHourInMs);
        updateData.youtube_token_expires_at = expiryDate.toISOString();
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

  // Function to refresh YouTube token
  const refreshYoutubeToken = async (refreshToken) => {
    try {
      const response = await fetch('/api/auth/refresh-youtube-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: user.id,
          refreshToken: refreshToken || youtubeRefreshToken
        })
      });

      const data = await response.json();
      if (data.access_token) {
        setYoutubeAccessToken(data.access_token);
        localStorage.setItem("yt_access_token", data.access_token);
        
        // If we got a new refresh token, update it too
        if (data.refresh_token) {
          setYoutubeRefreshToken(data.refresh_token);
          localStorage.setItem("yt_refresh_token", data.refresh_token);
        }
        
        await updateTokensInSupabase({ 
          youtube_access_token: data.access_token,
          youtube_refresh_token: data.refresh_token || refreshToken || youtubeRefreshToken
        });
        
        setTokenError(null);
        return true;
      }
    } catch (error) {
      console.error("Error refreshing YouTube token:", error);
    }
    return false;
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
          .select("facebook_access_token, instagram_access_token, facebook_token_expires_at, instagram_token_expires_at, youtube_access_token, youtube_refresh_token, youtube_token_expires_at")
          .eq("user_id", user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error("Error fetching tokens:", error);
          // Don't return here, try localStorage fallback
        }

        let fbTokenSet = false;
        let igTokenSet = false;
        let ytTokenSet = false;

        if (data) {
          console.log("Raw database data:", {
            fbToken: data.facebook_access_token ? 'present' : 'null',
            igToken: data.instagram_access_token ? 'present' : 'null',
            ytToken: data.youtube_access_token ? 'present' : 'null',
            fbExpiry: data.facebook_token_expires_at,
            igExpiry: data.instagram_token_expires_at,
            ytExpiry: data.youtube_token_expires_at,
            currentTime: new Date().toISOString()
          });
        }

        // Handle Facebook token from database
        if (data?.facebook_access_token) {
          console.log("Found Facebook token in database");
          
          // Check if token is expired
          if (isTokenExpired(data.facebook_access_token, data.facebook_token_expires_at)) {
            console.log("Facebook token is expired, clearing...");
            // Clear only Facebook token
            await supabase
              .from("user_sessions")
              .update({
                facebook_access_token: null,
                facebook_token_expires_at: null,
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", user.id);
            localStorage.removeItem("fb_access_token");
            setFbAccessToken(null);
          } else {
            // Set token first, then validate asynchronously
            setFbAccessToken(data.facebook_access_token);
            localStorage.setItem("fb_access_token", data.facebook_access_token);
            fbTokenSet = true;
            
            // Validate token asynchronously (don't block UI)
            validateFacebookToken(data.facebook_access_token).then((isValid) => {
              if (!isValid) {
                console.log("Facebook token is invalid, clearing...");
                // Clear only Facebook token
                supabase
                  .from("user_sessions")
                  .update({
                    facebook_access_token: null,
                    facebook_token_expires_at: null,
                    updated_at: new Date().toISOString(),
                  })
                  .eq("user_id", user.id);
                localStorage.removeItem("fb_access_token");
                setFbAccessToken(null);
              } else {
                setTokenError(null);
              }
            });
          }
        }

        // Handle Instagram token from database
        if (data?.instagram_access_token) {
          console.log("Found Instagram token in database");
          console.log("Instagram token expiry check:", {
            token: data.instagram_access_token ? 'present' : 'null',
            expiresAt: data.instagram_token_expires_at,
            currentTime: new Date().toISOString()
          });
          
          const tokenIsExpired = isTokenExpired(data.instagram_access_token, data.instagram_token_expires_at);
          console.log("Instagram token expired check result:", tokenIsExpired);
          
          if (tokenIsExpired) {
            console.log("Instagram token is expired, clearing...");
            // Clear just Instagram token
            await supabase
              .from("user_sessions")
              .update({
                instagram_access_token: null,
                instagram_token_expires_at: null,
                updated_at: new Date().toISOString(),
              })
              .eq("user_id", user.id);
            localStorage.removeItem("ig_access_token");
            setInstagramAccessToken(null);
          } else {
            console.log("Setting Instagram token in state - token is valid");
            setInstagramAccessToken(data.instagram_access_token);
            localStorage.setItem("ig_access_token", data.instagram_access_token);
            igTokenSet = true;
            setTokenError(null); // Clear any previous errors
            console.log("Instagram token state updated successfully");
          }
        } else {
          console.log("No Instagram token found in database");
          setInstagramAccessToken(null);
        }

        // Handle YouTube token from database
        if (data?.youtube_access_token && data?.youtube_refresh_token) {
          console.log("Found YouTube tokens in database");
          
          // Check if token is expired
          if (isTokenExpired(data.youtube_access_token, data.youtube_token_expires_at)) {
            console.log("YouTube token is expired, attempting to refresh...");
            // Try to refresh the token using the refresh token
            const refreshed = await refreshYoutubeToken(data.youtube_refresh_token);
            
            if (!refreshed) {
              // If refresh failed, clear tokens
              console.log("YouTube token refresh failed, clearing tokens...");
              await supabase
                .from("user_sessions")
                .update({
                  youtube_access_token: null,
                  youtube_refresh_token: null,
                  youtube_token_expires_at: null,
                  updated_at: new Date().toISOString(),
                })
                .eq("user_id", user.id);
              localStorage.removeItem("yt_access_token");
              localStorage.removeItem("yt_refresh_token");
              setYoutubeAccessToken(null);
              setYoutubeRefreshToken(null);
            }
          } else {
            // Set tokens
            setYoutubeAccessToken(data.youtube_access_token);
            setYoutubeRefreshToken(data.youtube_refresh_token);
            localStorage.setItem("yt_access_token", data.youtube_access_token);
            localStorage.setItem("yt_refresh_token", data.youtube_refresh_token);
            ytTokenSet = true;
            setTokenError(null);
          }
        } else {
          console.log("No YouTube tokens found in database");
          setYoutubeAccessToken(null);
          setYoutubeRefreshToken(null);
        }

        // Fallback to localStorage if no tokens from database
        if (!fbTokenSet) {
          const localFbToken = localStorage.getItem("fb_access_token");
          if (localFbToken) {
            console.log("Using Facebook token from localStorage");
            setFbAccessToken(localFbToken);
            
            // Validate local token asynchronously
            validateFacebookToken(localFbToken).then(async (isValid) => {
              if (isValid) {
                // Store in Supabase for future use
                await updateTokensInSupabase({ facebook_access_token: localFbToken });
                setTokenError(null);
              } else {
                // Clear invalid local token
                localStorage.removeItem("fb_access_token");
                setFbAccessToken(null);
                setTokenError("Your Facebook token has expired. Please reconnect your account.");
              }
            });
          } else {
            console.log("No Facebook token found");
          }
        }

        if (!igTokenSet) {
          const localIgToken = localStorage.getItem("ig_access_token");
          if (localIgToken) {
            console.log("Using Instagram token from localStorage");
            setInstagramAccessToken(localIgToken);
            setTokenError(null);
          } else {
            console.log("No Instagram token found in localStorage");
            setInstagramAccessToken(null);
          }
        }
        
        // Fallback to localStorage for YouTube tokens
        if (!ytTokenSet) {
          const localYtAccessToken = localStorage.getItem("yt_access_token");
          const localYtRefreshToken = localStorage.getItem("yt_refresh_token");
          
          if (localYtAccessToken && localYtRefreshToken) {
            console.log("Using YouTube tokens from localStorage");
            setYoutubeAccessToken(localYtAccessToken);
            setYoutubeRefreshToken(localYtRefreshToken);
            setTokenError(null);
            
            // Store in Supabase for future use
            await updateTokensInSupabase({
              youtube_access_token: localYtAccessToken,
              youtube_refresh_token: localYtRefreshToken
            });
          } else {
            console.log("No YouTube tokens found in localStorage");
            setYoutubeAccessToken(null);
            setYoutubeRefreshToken(null);
          }
        }

      } catch (error) {
        console.error("Error fetching tokens:", error);
        setTokenError("Error loading your social media connections. Please try reconnecting.");
      }
    };

    fetchTokens();
  }, [user, supabase]);

  const login = async (provider) => {
    try {
      window.location.href = "/auth/login";
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
      setYoutubeAccessToken(null);
      setYoutubeRefreshToken(null);
      setSupabase(null);
      setTokenError(null);

      // Clear localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem("fb_access_token");
        localStorage.removeItem("ig_access_token");
        localStorage.removeItem("yt_access_token");
        localStorage.removeItem("yt_refresh_token");
      }

      // Redirect to Auth0 logout
      window.location.href = "/auth/logout";
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Function to refresh tokens from database (useful after connecting accounts)
  const refreshTokensFromDatabase = async () => {
    if (!user?.id || !supabase) {
      console.log("Cannot refresh tokens: missing user or supabase");
      return;
    }

    try {
      console.log("Refreshing tokens from database for user:", user.id);
      
      const { data, error } = await supabase
        .from("user_sessions")
        .select("facebook_access_token, instagram_access_token, facebook_token_expires_at, instagram_token_expires_at, youtube_access_token, youtube_refresh_token, youtube_token_expires_at")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching tokens for refresh:", error);
        return;
      }

      // Update Facebook token
      if (data?.facebook_access_token) {
        if (!isTokenExpired(data.facebook_access_token, data.facebook_token_expires_at)) {
          console.log("Refreshing Facebook token in state");
          setFbAccessToken(data.facebook_access_token);
          localStorage.setItem("fb_access_token", data.facebook_access_token);
          setTokenError(null);
        }
      } else {
        setFbAccessToken(null);
        localStorage.removeItem("fb_access_token");
      }

      // Update Instagram token
      if (data?.instagram_access_token) {
        if (!isTokenExpired(data.instagram_access_token, data.instagram_token_expires_at)) {
          console.log("Refreshing Instagram token in state");
          setInstagramAccessToken(data.instagram_access_token);
          localStorage.setItem("ig_access_token", data.instagram_access_token);
          setTokenError(null);
        }
      } else {
        setInstagramAccessToken(null);
        localStorage.removeItem("ig_access_token");
      }
      
      // Update YouTube tokens
      if (data?.youtube_access_token && data?.youtube_refresh_token) {
        if (!isTokenExpired(data.youtube_access_token, data.youtube_token_expires_at)) {
          console.log("Refreshing YouTube tokens in state");
          setYoutubeAccessToken(data.youtube_access_token);
          setYoutubeRefreshToken(data.youtube_refresh_token);
          localStorage.setItem("yt_access_token", data.youtube_access_token);
          localStorage.setItem("yt_refresh_token", data.youtube_refresh_token);
          setTokenError(null);
        } else {
          // Try to refresh the token
          await refreshYoutubeToken(data.youtube_refresh_token);
        }
      } else {
        setYoutubeAccessToken(null);
        setYoutubeRefreshToken(null);
        localStorage.removeItem("yt_access_token");
        localStorage.removeItem("yt_refresh_token");
      }

    } catch (error) {
      console.error("Error refreshing tokens:", error);
    }
  };

  const value = {
    user,
    loading: loading || isLoading,
    login,
    logout,
    isAuthenticated: !!user,
    fbAccessToken,
    accessToken: fbAccessToken, // Keep for backward compatibility
    instagramAccessToken: instagramAccessToken,
    youtubeAccessToken: youtubeAccessToken,
    youtubeRefreshToken: youtubeRefreshToken,
    supabase, // Expose supabase client
    tokenError, // Expose token error state
    refreshYoutubeToken, // Expose YouTube refresh function
    refreshTokensFromDatabase, // Expose refresh function for settings page
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
