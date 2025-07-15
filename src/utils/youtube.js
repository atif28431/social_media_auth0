/**
 * Utility functions for YouTube API interactions
 */

/**
 * Get user's YouTube channels
 * @param {string} accessToken - The YouTube Access Token
 * @returns {Promise<Array>} - The response from YouTube with channel information
 */
export async function getUserYoutubeChannels(accessToken) {
  try {
    if (!accessToken) {
      throw new Error("No access token provided. Please connect your YouTube account.");
    }
    
    console.log("Fetching YouTube channels with token length:", accessToken ? accessToken.length : 0);
    
    const response = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails,statistics&mine=true",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("YouTube API error:", errorData);
      throw new Error(`YouTube API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    console.log("YouTube channels data:", data);
    
    return data.items || [];
  } catch (error) {
    console.error("Error fetching YouTube channels:", error);
    throw error;
  }
}

/**
 * Upload a video to YouTube via API route
 * @param {string} accessToken - The YouTube Access Token (not used directly, for compatibility)
 * @param {string} title - The video title
 * @param {string} description - The video description
 * @param {string} mediaUrl - The URL of the video file
 * @param {Array} tags - Array of tags for the video
 * @param {string} categoryId - The YouTube category ID
 * @param {string} privacyStatus - The privacy status (private, unlisted, public)
 * @param {string} userId - The user ID for authentication
 * @returns {Promise<Object>} - The response from YouTube with video details
 */
export async function uploadVideoToYoutube(
  accessToken,
  title,
  description,
  mediaUrl,
  tags = [],
  categoryId = "22", // People & Blogs by default
  privacyStatus = "public",
  userId = null
) {
  try {
    if (!title) {
      throw new Error("Video title is required.");
    }
    
    if (!mediaUrl) {
      throw new Error("No media URL provided. Please upload a video.");
    }
    
    // Get user ID from context if not provided
    if (!userId) {
      throw new Error("User ID is required for YouTube upload.");
    }
    
    console.log("Uploading video to YouTube via API:", {
      title,
      description: description ? description.substring(0, 50) + "..." : "(empty)",
      mediaUrl: mediaUrl ? "provided" : "missing",
      tags: Array.isArray(tags) ? tags.length : "invalid",
      categoryId,
      privacyStatus,
      userId
    });
    
    // Ensure tags is an array
    const videoTags = Array.isArray(tags) ? tags : [];
    
    // Call the server-side API route
    const response = await fetch('/api/youtube/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        description,
        mediaUrl,
        tags: videoTags,
        categoryId,
        privacyStatus,
        userId
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("YouTube upload API error:", errorData);
      throw new Error(errorData.error || `Upload failed with status ${response.status}`);
    }
    
    const result = await response.json();
    console.log("YouTube upload successful:", result);
    
    return result.video;
  } catch (error) {
    console.error("Error uploading video to YouTube:", error);
    throw error;
  }
}

/**
 * Schedule a video for upload to YouTube via API route
 * @param {string} accessToken - The YouTube Access Token (not used directly, for compatibility)
 * @param {string} title - The video title
 * @param {string} description - The video description
 * @param {string} mediaUrl - The URL of the video file
 * @param {Date} scheduledPublishTime - The time to publish the video
 * @param {Array} tags - Array of tags for the video
 * @param {string} categoryId - The YouTube category ID
 * @param {string} userId - The user ID for authentication
 * @returns {Promise<Object>} - The response from YouTube with video details
 */
export async function scheduleVideoForYoutube(
  accessToken,
  title,
  description,
  mediaUrl,
  scheduledPublishTime,
  tags = [],
  categoryId = "22", // People & Blogs by default
  userId = null
) {
  try {
    if (!title) {
      throw new Error("Video title is required.");
    }
    
    if (!mediaUrl) {
      throw new Error("No media URL provided. Please upload a video.");
    }
    
    if (!scheduledPublishTime) {
      throw new Error("No scheduled publish time provided. Please select a time to schedule.");
    }
    
    // Get user ID from context if not provided
    if (!userId) {
      throw new Error("User ID is required for YouTube upload.");
    }
    
    console.log("Scheduling video for YouTube via API:", {
      title,
      description: description ? description.substring(0, 50) + "..." : "(empty)",
      mediaUrl: mediaUrl ? "provided" : "missing",
      scheduledPublishTime: scheduledPublishTime.toISOString(),
      tags: Array.isArray(tags) ? tags.length : "invalid",
      categoryId,
      userId
    });
    
    // Ensure tags is an array
    const videoTags = Array.isArray(tags) ? tags : [];
    
    // Call the server-side API route
    const response = await fetch('/api/youtube/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title,
        description,
        mediaUrl,
        tags: videoTags,
        categoryId,
        privacyStatus: 'private', // Initially private for scheduled uploads
        scheduledPublishTime: scheduledPublishTime.toISOString(),
        userId
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("YouTube schedule API error:", errorData);
      throw new Error(errorData.error || `Schedule failed with status ${response.status}`);
    }
    
    const result = await response.json();
    console.log("YouTube schedule successful:", result);
    
    return result.video;
  } catch (error) {
    console.error("Error scheduling video for YouTube:", error);
    throw error;
  }
}

/**
 * Get YouTube video categories
 * @param {string} accessToken - The YouTube Access Token
 * @param {string} regionCode - The region code (e.g., 'US')
 * @returns {Promise<Array>} - The response from YouTube with category information
 */
export async function getYoutubeCategories(accessToken, regionCode = "US") {
  try {
    if (!accessToken) {
      throw new Error("No access token provided. Please connect your YouTube account.");
    }
    
    console.log("Fetching YouTube categories with token length:", accessToken ? accessToken.length : 0);
    
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videoCategories?part=snippet&regionCode=${regionCode}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("YouTube API error:", errorData);
      throw new Error(`YouTube API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    console.log("YouTube categories data:", data);
    
    return data.items || [];
  } catch (error) {
    console.error("Error fetching YouTube categories:", error);
    throw error;
  }
}