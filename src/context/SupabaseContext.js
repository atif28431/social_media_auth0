"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

const SupabaseContext = createContext();

export function SupabaseProvider({ children }) {
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user, isAuthenticated, supabase } = useAuth();

  // Fetch scheduled posts when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user?.id && supabase) {
      fetchScheduledPosts();
    }
  }, [isAuthenticated, user, supabase]);

  // Function to fetch scheduled posts from Supabase
  const fetchScheduledPosts = async () => {
    if (!isAuthenticated || !user?.id || !supabase) {
      console.error("Cannot fetch posts: missing user.id or supabase client");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      console.log("Fetching posts for user:", user.id);
      const { data, error } = await supabase
        .from("scheduled_posts")
        .select("*")
        .order("scheduled_publish_time", { ascending: true });
        
      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }
      
      console.log("Fetched posts:", data);
      setScheduledPosts(data || []);
    } catch (err) {
      console.error("Error fetching scheduled posts:", err);
      setError("Failed to load scheduled posts");
    } finally {
      setLoading(false);
    }
  };

  // Function to add a scheduled post to Supabase
  const addScheduledPost = async (postData) => {
    if (!isAuthenticated || !user?.id || !supabase) return null;

    try {
      const postObject = {
        user_id: user.id,
        message: postData.message,
        scheduled_publish_time: postData.scheduledPublishTime,
        page_id: postData.pageId,
        page_name: postData.pageName,
        status: "scheduled",
        platform: postData.platform || "facebook",
      };

      // Add Instagram-specific fields if applicable
      if (postData.platform === "instagram" && postData.instagramContainerId) {
        postObject.instagram_container_id = postData.instagramContainerId;
      }

      // Add Facebook-specific fields if applicable
      if (postData.platform === "facebook" && postData.facebook_post_id) {
        postObject.post_id = postData.facebook_post_id;
      }

      const { data, error } = await supabase
        .from("scheduled_posts")
        .insert([postObject])
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setScheduledPosts((prev) => [...prev, data]);

      return data;
    } catch (err) {
      console.error("Error adding scheduled post:", err);
      throw err;
    }
  };

  // Function to update a scheduled post
  const updateScheduledPost = async (postId, updates) => {
    if (!isAuthenticated || !user?.id || !supabase) return null;

    try {
      const { data, error } = await supabase
        .from("scheduled_posts")
        .update(updates)
        .eq("id", postId)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setScheduledPosts((prev) =>
        prev.map((post) => (post.id === postId ? data : post))
      );

      return data;
    } catch (err) {
      console.error("Error updating scheduled post:", err);
      throw err;
    }
  };

  // Function to delete a scheduled post
  const deleteScheduledPost = async (postId) => {
    if (!isAuthenticated || !user?.id || !supabase) return false;

    try {
      const { error } = await supabase
        .from("scheduled_posts")
        .delete()
        .eq("id", postId)
        .eq("user_id", user.id);

      if (error) throw error;

      // Update local state
      setScheduledPosts((prev) => prev.filter((post) => post.id !== postId));

      return true;
    } catch (err) {
      console.error("Error deleting scheduled post:", err);
      throw err;
    }
  };

  // Function to save user's Facebook pages to Supabase
  const saveUserPages = async (pages) => {
    if (!isAuthenticated || !user?.id || !supabase || !pages?.length) {
      console.log('saveUserPages validation failed:', {
        isAuthenticated,
        hasUserId: !!user?.id,
        hasSupabase: !!supabase,
        pagesLength: pages?.length
      });
      return false;
    }

    try {
      console.log('Saving pages for user:', user.id);
      console.log('Pages to save:', pages.length);
      
      // First delete existing pages to avoid duplicates
      const deleteResult = await supabase.from("facebook_pages").delete().eq("user_id", user.id);
      console.log('Delete result:', deleteResult);

      // Then insert the new pages
      const pagesData = pages.map((page) => ({
        user_id: user.id,
        page_id: page.id,
        page_name: page.name,
        access_token: page.access_token,
        category: page.category || null,
      }));

      console.log('Inserting pages data:', pagesData);
      const { data, error } = await supabase.from("facebook_pages").insert(pagesData);

      if (error) {
        console.error('Insert error:', error);
        throw error;
      }

      console.log('Pages saved successfully:', data);
      return true;
    } catch (err) {
      console.error("Error saving user pages:", err);
      console.log('Save result: false');
      return false;
    }
  };

  // Function to get user's saved Facebook pages from Supabase
  const getUserPages = async () => {
    if (!isAuthenticated || !user?.id || !supabase) return [];

    try {
      console.log("Fetching user pages for user:", user.id);
      const { data, error } = await supabase
        .from("facebook_pages")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;

      return data || [];
    } catch (err) {
      console.error("Error fetching user pages:", err);
      return [];
    }
  };

  // Function to save user's Instagram accounts to Supabase
  const saveInstagramAccounts = async (accounts) => {
    if (!isAuthenticated || !user?.id || !supabase || !accounts?.length) return false;

    try {
      // First delete existing accounts to avoid duplicates
      await supabase.from("instagram_accounts").delete().eq("user_id", user.id);

      // Then insert the new accounts
      const accountsData = accounts.map((account) => ({
        user_id: user.id,
        instagram_account_id: account.id,
        username: account.username,
        name: account.name,
        profile_picture_url: account.profilePicture,
        page_id: account.pageId,
        page_name: account.pageName,
        access_token: account.pageAccessToken,
      }));

      const { error } = await supabase
        .from("instagram_accounts")
        .insert(accountsData);

      if (error) throw error;

      return true;
    } catch (err) {
      console.error("Error saving Instagram accounts:", err);
      return false;
    }
  };

  // Function to get user's saved Instagram accounts from Supabase
  const getUserInstagramAccounts = async () => {
    if (!isAuthenticated || !user?.id || !supabase) return [];

    try {
      const { data, error } = await supabase
        .from("instagram_accounts")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;

      return data || [];
    } catch (err) {
      console.error("Error fetching Instagram accounts:", err);
      return [];
    }
  };

  // Function to upload an image to Supabase Storage and get a public URL
  const uploadImage = async (file, folder = "instagram") => {
    if (!isAuthenticated || !user?.id || !supabase || !file) {
      throw new Error("Authentication or file required for upload");
    }

    try {
      // Create a unique file name to avoid collisions
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${fileExt}`;
      
      // Format the user ID to be compatible with storage paths
      // Replace the pipe character with underscore to avoid path issues
      const formattedUserId = user.id.replace(/\|/g, '_');
      
      // Include the user ID in the path to satisfy RLS policies
      // Format: userId/folder/filename
      const filePath = `${formattedUserId}/${folder}/${fileName}`;

      console.log("Uploading file with path:", filePath);
      
      // Upload the file to Supabase Storage
      const { data, error } = await supabase.storage
        .from('social-media-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error("Supabase storage upload error:", error);
        throw error;
      }

      // Get the public URL for the uploaded file
      const { data: { publicUrl } } = supabase.storage
        .from('social-media-images')
        .getPublicUrl(filePath);

      console.log("File uploaded successfully, public URL:", publicUrl);
      return publicUrl;
    } catch (err) {
      console.error("Error uploading image:", err);
      throw new Error("Failed to upload image: " + (err.message || "Unknown error"));
    }
  };

  const value = {
    supabase,
    scheduledPosts,
    loading,
    error,
    fetchScheduledPosts,
    addScheduledPost,
    updateScheduledPost,
    deleteScheduledPost,
    saveUserPages,
    getUserPages,
    saveInstagramAccounts,
    getUserInstagramAccounts,
    uploadImage,
  };

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
}

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error("useSupabase must be used within a SupabaseProvider");
  }
  return context;
};