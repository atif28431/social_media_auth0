/**
 * Enhanced utility functions for Facebook API interactions with token validation
 * Fixed story posting endpoints and error handling
 * Added debugging and enhanced video story upload capabilities
 */

/**
 * Debug function to check current token permissions
 */
export async function debugTokenPermissions(accessToken) {
  try {
    const response = await fetch(
      `https://graph.facebook.com/me/permissions?access_token=${accessToken}`
    );
    const data = await response.json();
    console.log('Current permissions:', data.data);
    
    // Check for required video story permissions
    const permissions = data.data || [];
    const requiredPerms = ['pages_manage_posts', 'pages_show_list', 'pages_read_engagement'];
    const hasRequired = requiredPerms.every(perm => 
      permissions.some(p => p.permission === perm && p.status === 'granted')
    );
    
    console.log('Has required permissions for video stories:', hasRequired);
    return { permissions: data.data, hasRequired };
  } catch (error) {
    console.error('Error checking permissions:', error);
    return null;
  }
}

/**
 * Test video story upload capability
 */
export async function testVideoStoryCapability(pageId, accessToken) {
  try {
    console.log('Testing video story capability for page:', pageId);
    
    // First check permissions
    const permCheck = await debugTokenPermissions(accessToken);
    if (!permCheck?.hasRequired) {
      console.warn('Missing required permissions for video stories');
    }
    
    // Test the initial video story creation without actual upload
    const testResponse = await fetch(
      `https://graph.facebook.com/${pageId}/video_stories`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          upload_phase: "start",
          access_token: accessToken,
        }),
      }
    );

    const data = await testResponse.json();
    console.log('Video story test response:', data);
    
    if (data.error) {
      console.error('Video story capability test failed:', {
        code: data.error.code,
        type: data.error.type,
        message: data.error.message,
        error_subcode: data.error.error_subcode,
        fbtrace_id: data.error.fbtrace_id
      });
      
      // Provide specific error guidance
      switch (data.error.code) {
        case 200:
          console.error('PERMISSION ERROR: Your app lacks permissions for video stories. Check Facebook App Review status.');
          break;
        case 100:
          console.error('PARAMETER ERROR: Invalid request parameters or page configuration.');
          break;
        case 190:
          console.error('TOKEN ERROR: Access token is invalid or expired.');
          break;
        default:
          console.error('UNKNOWN ERROR: Check Facebook Developer Console for app status.');
      }
    }
    
    return data;
  } catch (error) {
    console.error('Test error:', error);
    return null;
  }
}

/**
 * Get detailed page information including capabilities
 */
export async function getPageCapabilities(pageId, accessToken) {
  try {
    const response = await fetch(
      `https://graph.facebook.com/${pageId}?fields=id,name,category,about,is_verified,fan_count,tasks&access_token=${accessToken}`
    );
    const data = await response.json();
    
    if (data.error) {
      console.error('Error getting page info:', data.error);
      return null;
    }
    
    console.log('Page capabilities:', data);
    return data;
  } catch (error) {
    console.error('Error checking page capabilities:', error);
    return null;
  }
}

/**
 * Validate if an access token is still valid
 * @param {string} accessToken - The Facebook access token to validate
 * @returns {Promise<boolean>} - Whether the token is valid
 */
export async function validateAccessToken(accessToken) {
  try {
    const response = await fetch(
      `https://graph.facebook.com/me?access_token=${accessToken}`
    );
    const data = await response.json();

    if (response.ok && !data.error) {
      return true;
    }

    console.log("Token validation failed:", data.error);
    return false;
  } catch (error) {
    console.error("Error validating access token:", error);
    return false;
  }
}

/**
 * Get fresh page access tokens
 * @param {string} userAccessToken - The user's access token
 * @returns {Promise<Array>} - Array of pages with fresh tokens
 */
export async function refreshUserPages(userAccessToken) {
  try {
    // First validate the user access token
    const isValid = await validateAccessToken(userAccessToken);
    if (!isValid) {
      throw new Error(
        "User access token is invalid. Please reconnect your Facebook account."
      );
    }

    const response = await fetch(
      `https://graph.facebook.com/me/accounts?fields=id,name,access_token,category&access_token=${userAccessToken}`
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to refresh user pages");
    }

    return data.data; // Array of pages with fresh tokens
  } catch (error) {
    console.error("Error refreshing user pages:", error);
    throw error;
  }
}

/**
 * Helper function to validate video requirements for Facebook stories
 * @param {Blob} videoBlob - The video blob to validate
 * @returns {Promise<void>} - Throws error if validation fails
 */
async function validateVideoForStory(videoBlob) {
  // Check file size (100MB limit for story videos)
  const MAX_SIZE = 100 * 1024 * 1024; // 100MB in bytes
  if (videoBlob.size > MAX_SIZE) {
    throw new Error(
      `Video file size (${Math.round(
        videoBlob.size / 1024 / 1024
      )}MB) exceeds the 100MB limit for Facebook stories`
    );
  }

  // Check duration using HTML5 video element
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);

      // Check duration (60 second limit for stories)
      if (video.duration > 60) {
        reject(
          new Error(
            `Video duration (${Math.round(
              video.duration
            )}s) exceeds the 60 second limit for Facebook stories`
          )
        );
        return;
      }

      // Check resolution (minimum 540p required)
      if (video.videoHeight < 540) {
        reject(
          new Error(
            `Video height (${video.videoHeight}p) is below the minimum requirement of 540p for Facebook stories`
          )
        );
        return;
      }

      resolve();
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(
        new Error(
          "Failed to load video metadata. Please ensure the video file is valid."
        )
      );
    };

    video.src = URL.createObjectURL(videoBlob);
  });
}

/**
 * Helper function to handle video story upload
 * @param {string} mediaUrl - The video URL
 * @param {string} uploadUrl - Facebook's upload URL
 * @returns {Promise<boolean>} - Whether upload was successful
 */
async function uploadVideoToFacebook(mediaUrl, uploadUrl) {
  try {
    console.log("Fetching video from URL:", mediaUrl);

    // First, fetch the video from the mediaUrl
    const videoResponse = await fetch(mediaUrl);
    if (!videoResponse.ok) {
      throw new Error(
        `Failed to fetch video from URL: ${mediaUrl}, status: ${videoResponse.status}`
      );
    }

    const videoBlob = await videoResponse.blob();
    console.log("Video fetched successfully, size:", videoBlob.size, "bytes");

    // Validate video requirements before attempting upload
    try {
      await validateVideoForStory(videoBlob);
    } catch (validationError) {
      throw validationError;
    }

    // Upload the video to Facebook's provided URL via our proxy API
    console.log("Uploading video to Facebook URL via proxy:", uploadUrl);

    // Convert the Blob to a base64 string for JSON transport
    const reader = new FileReader();
    const blobToBase64 = new Promise((resolve) => {
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(videoBlob);
    });
    const base64Video = await blobToBase64;

    const uploadResponse = await fetch("/api/facebook/video-upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        uploadUrl: uploadUrl,
        videoBlob: base64Video,
      }),
    });

    console.log("Upload response status:", uploadResponse.status);

    if (!uploadResponse.ok) {
      // Parse the error response
      let errorMessage = "Failed to upload video for story";
      try {
        const errorData = await uploadResponse.json();

        // Check for specific error types from our proxy
        if (errorData.error_type === "auth_error") {
          console.error(
            "Facebook authentication error:",
            errorData.error_message
          );
          throw new Error(
            "Facebook authentication error. Please reconnect your Facebook account and try again."
          );
        }
        errorMessage +=
          ": " +
          (errorData.error_message || errorData.message || "Unknown error");
      } catch (e) {
        // If we can't parse the error as JSON, use status code
        console.log("Error response is not JSON, using status code");
        errorMessage += `: Status ${uploadResponse.status}`;
      }
      throw new Error(errorMessage);
    }

    // Try to parse response, but don't fail if it's not JSON
    try {
      const uploadData = await uploadResponse.json();
      console.log("Upload successful:", uploadData);
    } catch (e) {
      console.log("Upload response is not JSON, but status indicates success");
    }

    return true;
  } catch (error) {
    console.error("Error uploading video:", error);
    throw error;
  }
}

/**
 * Helper function to finalize video story upload
 * @param {string} pageId - The page ID
 * @param {string} videoId - The video ID from initial upload
 * @param {string} accessToken - The access token
 * @param {string} message - The story message
 * @returns {Promise<object>} - The finalized story data
 */
async function finalizeVideoStory(pageId, videoId, accessToken, message) {
  try {
    console.log("Finalizing video story upload with video_id:", videoId);

    const finalizeEndpoint = `https://graph.facebook.com/${pageId}/video_stories`;
    const finalizePostData = {
      upload_phase: "finish",
      video_id: videoId,
      access_token: accessToken,
      description: message,
    };

    console.log(
      "Sending finalize request with data:",
      JSON.stringify(finalizePostData)
    );

    const response = await fetch(finalizeEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(finalizePostData),
    });

    console.log("Finalize response status:", response.status);
    const data = await response.json();
    console.log("Finalize response data:", JSON.stringify(data));

    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to finalize video story");
    }

    return data;
  } catch (error) {
    console.error("Error finalizing video story:", error);
    throw error;
  }
}

/**
 * Enhanced video story upload with fallback options
 */
export async function uploadVideoStoryWithFallback(
  accessToken,
  message,
  pageId,
  userAccessToken = null,
  onTokenRefresh = null,
  mediaUrl = null
) {
  try {
    console.log('🔍 Starting enhanced video story upload with debugging...');
    
    // Step 1: Test capability first
    const capabilityTest = await testVideoStoryCapability(pageId, accessToken);
    
    if (capabilityTest?.error) {
      console.log('❌ Video story capability test failed. Error details:', capabilityTest.error);
      
      // If video story fails due to permissions, try regular video post as fallback
      console.log('🔄 Video story failed, attempting regular video post as fallback...');
      
      return await postToFacebook(
        accessToken,
        message,
        pageId,
        userAccessToken,
        onTokenRefresh,
        mediaUrl,
        'video' // Regular video instead of story_video
      );
    }
    
    console.log('✅ Video story capability test passed, proceeding with story upload...');
    
    // Step 2: Proceed with normal video story upload
    return await postToFacebook(
      accessToken,
      message,
      pageId,
      userAccessToken,
      onTokenRefresh,
      mediaUrl,
      'story_video'
    );
    
  } catch (error) {
    console.error('❌ Enhanced video story upload failed:', error);
    
    // Final fallback: try regular video
    console.log('🔄 Attempting final fallback to regular video post...');
    try {
      const fallbackResult = await postToFacebook(
        accessToken,
        message,
        pageId,
        userAccessToken,
        onTokenRefresh,
        mediaUrl,
        'video'
      );
      
      console.log('✅ Fallback video upload successful');
      return { ...fallbackResult, fallback_used: true, original_error: error.message };
    } catch (fallbackError) {
      console.error('❌ All video upload methods failed:', fallbackError);
      throw new Error(`Video upload failed: ${error.message}. Fallback also failed: ${fallbackError.message}`);
    }
  }
}

/**
 * Alternative video story approach using different API endpoint
 */
export async function uploadVideoStoryAlternative(pageId, accessToken, mediaUrl, message) {
  try {
    console.log('🔄 Trying alternative video story upload method...');
    
    // Alternative approach: Upload as regular video first, then convert to story
    const endpoint = `https://graph.facebook.com/${pageId}/videos`;
    const postData = {
      file_url: mediaUrl,
      description: message,
      access_token: accessToken,
      published: false, // Don't publish immediately
      content_category: 'OTHER', // Required for some apps
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Alternative video upload failed');
    }

    console.log('✅ Alternative video upload successful:', data);
    
    // If successful, try to promote to story (this may not work for all apps)
    try {
      const storyEndpoint = `https://graph.facebook.com/${pageId}/video_stories`;
      const storyData = {
        video_id: data.id,
        access_token: accessToken,
      };

      const storyResponse = await fetch(storyEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(storyData),
      });

      if (storyResponse.ok) {
        const storyResult = await storyResponse.json();
        console.log('✅ Successfully promoted to story:', storyResult);
        return storyResult;
      } else {
        console.log('⚠️ Could not promote to story, but video uploaded successfully');
        return { ...data, story_promotion_failed: true };
      }
    } catch (storyError) {
      console.log('⚠️ Story promotion failed, but video uploaded successfully');
      return { ...data, story_promotion_failed: true };
    }
    
  } catch (error) {
    console.error('❌ Alternative video story upload failed:', error);
    throw error;
  }
}

/**
 * Post to Facebook page
 * @param {string} accessToken - The Facebook access token
 * @param {string} message - The message to post
 * @param {string} pageId - Optional page ID if posting to a page
 * @param {string} userAccessToken - User's access token for token refresh
 * @param {Function} onTokenRefresh - Callback when tokens are refreshed
 * @param {string} mediaUrl - Optional media URL to include in the post
 * @param {string} mediaType - The type of media ('text', 'image', 'video', 'reel', 'story_image', 'story_video')
 * @returns {Promise} - The response from Facebook
 */
export async function postToFacebook(
  accessToken,
  message,
  pageId = null,
  userAccessToken = null,
  onTokenRefresh = null,
  mediaUrl = null,
  mediaType = "text"
) {
  try {
    // Debug logging to help track media type issues
    console.log('📤 Facebook post request:', {
      pageId,
      mediaType,
      hasMediaUrl: !!mediaUrl,
      messageLength: message?.length || 0
    });
    
    if (!pageId) {
      throw new Error(
        "Posting directly to personal timelines is no longer supported by Facebook. " +
          "Facebook requires using the Share Dialog for posting to personal timelines. " +
          "Please use the Share Dialog feature instead."
      );
    }

    // Build endpoint and post data based on media type
    let endpoint, postData;

    switch (mediaType) {
      case "image":
        endpoint = `https://graph.facebook.com/${pageId}/photos`;
        postData = {
          url: mediaUrl,
          caption: message,
          access_token: accessToken,
        };
        break;

      case "video":
        endpoint = `https://graph.facebook.com/${pageId}/videos`;
        postData = {
          file_url: mediaUrl,
          description: message,
          access_token: accessToken,
        };
        break;

      case "reel":
        endpoint = `https://graph.facebook.com/${pageId}/videos`;
        postData = {
          file_url: mediaUrl,
          description: message,
          access_token: accessToken,
          composer_session_id: `reels_${Date.now()}`,
          video_start_time_ms: "0",
          end_offset_ms: "0",
          is_explicit_share: "true",
          composer_entry_point: "reels_composer_entry_point",
        };
        break;

      case "story_image":
        endpoint = `https://graph.facebook.com/${pageId}/photos`;
        postData = {
          url: mediaUrl,
          caption: message,
          access_token: accessToken,
          published: false, // Don't publish immediately
        };
        break;

      case "story_video":
        // Add debugging for video story uploads
        console.log('🎬 Attempting video story upload for page:', pageId);
        endpoint = `https://graph.facebook.com/${pageId}/video_stories`;
        postData = {
          upload_phase: "start",
          access_token: accessToken,
        };
        break;

      case "text":
      default:
        endpoint = `https://graph.facebook.com/${pageId}/feed`;
        postData = {
          message,
          access_token: accessToken,
        };
        break;
    }

    // Function to attempt posting with given token
    const attemptPost = async (token) => {
      // Update post data with current token
      const currentPostData = { ...postData, access_token: token };

      console.log('🚀 Sending request to Facebook:', {
        endpoint,
        mediaType,
        pageId,
        hasMediaUrl: !!mediaUrl
      });

      let response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(currentPostData),
      });

      let data = await response.json();
      
      // Enhanced error logging for video stories
      if (!response.ok && mediaType === 'story_video') {
        console.error('❌ Video story upload failed:', {
          status: response.status,
          error: data.error,
          pageId,
          endpoint
        });
        
        // Log specific error details
        if (data.error) {
          console.error('📝 Error details:', {
            code: data.error.code,
            type: data.error.type,
            message: data.error.message,
            error_subcode: data.error.error_subcode,
            fbtrace_id: data.error.fbtrace_id
          });
        }
      }

      // Handle multi-step process for stories
      if (response.ok && mediaType === "story_image" && data.id) {
        // Step 2 for image stories: Publish the uploaded photo as a story
        const photoId = data.id;
        const storyEndpoint = `https://graph.facebook.com/${pageId}/photo_stories`;
        const storyPostData = {
          photo_id: photoId,
          access_token: token,
        };

        response = await fetch(storyEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(storyPostData),
        });

        data = await response.json();
      } else if (
        response.ok &&
        mediaType === "story_video" &&
        data.video_id &&
        data.upload_url
      ) {
        // Step 2 for video stories: Upload the video to the provided URL
        const videoId = data.video_id;
        const uploadUrl = data.upload_url;

        // Upload the video
        await uploadVideoToFacebook(mediaUrl, uploadUrl);

        // Step 3: Finalize the video story upload
        data = await finalizeVideoStory(pageId, videoId, token, message);
        response = { ok: true }; // Set response as successful
      }

      return { response, data };
    };

    // First attempt with current token
    let { response, data } = await attemptPost(accessToken);

    // If token is invalid, try to refresh
    if (!response.ok && data.error && data.error.code === 190) {
      console.log("Access token expired, attempting to refresh...");

      if (!userAccessToken) {
        throw new Error(
          "Access token expired and no user token provided for refresh. Please reconnect your Facebook account."
        );
      }

      try {
        // Get fresh page tokens
        const refreshedPages = await refreshUserPages(userAccessToken);
        const refreshedPage = refreshedPages.find((p) => p.id === pageId);

        if (!refreshedPage) {
          throw new Error(
            "Page not found after token refresh. Please reconnect your Facebook account."
          );
        }

        // Notify about token refresh
        if (onTokenRefresh) {
          onTokenRefresh(refreshedPages);
        }

        // Retry with fresh token
        ({ response, data } = await attemptPost(refreshedPage.access_token));
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        throw new Error(
          "Access token expired and refresh failed. Please reconnect your Facebook account."
        );
      }
    }

    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to post to Facebook");
    }

    return data;
  } catch (error) {
    console.error("Error posting to Facebook:", error);
    throw error;
  }
}

/**
 * Schedule a post to Facebook with token validation and optional media
 * @param {string} accessToken - The Facebook access token
 * @param {string} message - The message to post
 * @param {Date} scheduledTime - When to publish the post
 * @param {string} pageId - Optional page ID if posting to a page
 * @param {string} userAccessToken - User's access token for token refresh
 * @param {Function} onTokenRefresh - Callback when tokens are refreshed
 * @param {string} mediaUrl - Optional media URL to include in the post
 * @param {string} mediaType - The type of media ('text', 'image', 'video', 'reel')
 * @returns {Promise} - The response from Facebook
 */
export async function schedulePost(
  accessToken,
  message,
  scheduledTime,
  pageId = null,
  userAccessToken = null,
  onTokenRefresh = null,
  mediaUrl = null,
  mediaType = "text"
) {
  try {
    // Note: Stories cannot be scheduled on Facebook
    if (mediaType === "story_image" || mediaType === "story_video") {
      throw new Error(
        "Stories cannot be scheduled on Facebook. They must be posted immediately."
      );
    }

    if (!pageId) {
      throw new Error("Page ID is required for scheduling posts.");
    }

    let endpoint, postData;
    const scheduledPublishTime = Math.floor(scheduledTime.getTime() / 1000);

    switch (mediaType) {
      case "image":
        endpoint = `https://graph.facebook.com/${pageId}/photos`;
        postData = {
          url: mediaUrl,
          caption: message,
          published: false,
          scheduled_publish_time: scheduledPublishTime,
          access_token: accessToken,
        };
        break;

      case "video":
        endpoint = `https://graph.facebook.com/${pageId}/videos`;
        postData = {
          file_url: mediaUrl,
          description: message,
          published: false,
          scheduled_publish_time: scheduledPublishTime,
          access_token: accessToken,
        };
        break;

      case "reel":
        endpoint = `https://graph.facebook.com/${pageId}/videos`;
        postData = {
          file_url: mediaUrl,
          description: message,
          published: false,
          scheduled_publish_time: scheduledPublishTime,
          access_token: accessToken,
          composer_session_id: `reels_${Date.now()}`,
          video_start_time_ms: "0",
          end_offset_ms: "0",
          is_explicit_share: "true",
          composer_entry_point: "reels_composer_entry_point",
        };
        break;

      case "text":
      default:
        endpoint = `https://graph.facebook.com/${pageId}/feed`;
        postData = {
          message,
          published: false,
          scheduled_publish_time: scheduledPublishTime,
          access_token: accessToken,
        };
        break;
    }

    // Function to attempt scheduling with given token
    const attemptSchedule = async (token) => {
      const currentPostData = { ...postData, access_token: token };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(currentPostData),
      });

      const data = await response.json();
      return { response, data };
    };

    // First attempt with current token
    let { response, data } = await attemptSchedule(accessToken);

    // If token is invalid, try to refresh
    if (!response.ok && data.error && data.error.code === 190) {
      console.log("Access token expired, attempting to refresh...");

      if (!userAccessToken) {
        throw new Error(
          "Access token expired and no user token provided for refresh. Please reconnect your Facebook account."
        );
      }

      try {
        // Get fresh page tokens
        const refreshedPages = await refreshUserPages(userAccessToken);
        const refreshedPage = refreshedPages.find((p) => p.id === pageId);

        if (!refreshedPage) {
          throw new Error(
            "Page not found after token refresh. Please reconnect your Facebook account."
          );
        }

        // Notify about token refresh
        if (onTokenRefresh) {
          onTokenRefresh(refreshedPages);
        }

        // Retry with fresh token
        ({ response, data } = await attemptSchedule(
          refreshedPage.access_token
        ));
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        throw new Error(
          "Access token expired and refresh failed. Please reconnect your Facebook account."
        );
      }
    }

    if (!response.ok) {
      throw new Error(
        data.error?.message || "Failed to schedule post to Facebook"
      );
    }

    return data;
  } catch (error) {
    console.error("Error scheduling post to Facebook:", error);
    throw error;
  }
}

/**
 * Get user's Facebook pages with validation
 * @param {string} accessToken - The Facebook access token
 * @returns {Promise} - The response from Facebook with pages data
 */
export async function getUserPages(accessToken) {
  try {
    // First validate the access token
    const isValid = await validateAccessToken(accessToken);
    if (!isValid) {
      throw new Error(
        "Access token is invalid. Please reconnect your Facebook account."
      );
    }

    const response = await fetch(
      `https://graph.facebook.com/me/accounts?fields=id,name,access_token,category&access_token=${accessToken}`
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Failed to get user pages");
    }

    return data.data; // Array of pages
  } catch (error) {
    console.error("Error getting user pages:", error);
    throw error;
  }
}

/**
 * Check if user needs to reconnect Facebook
 * @param {string} accessToken - The Facebook access token to check
 * @returns {Promise<boolean>} - Whether reconnection is needed
 */
export async function needsReconnection(accessToken) {
  try {
    const isValid = await validateAccessToken(accessToken);
    return !isValid;
  } catch (error) {
    return true; // Assume reconnection needed on error
  }
}
