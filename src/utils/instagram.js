/**
 * Utility functions for Instagram API interactions
 */

/**
 * Get user's Instagram Business accounts linked via Facebook Pages
 * @param {string} userAccessToken - The Facebook User Access Token
 * @returns {Promise<Array>} - The response from Instagram with account + page access token
 */
export async function getUserInstagramAccounts(userAccessToken) {
  try {
    if (!userAccessToken) {
      throw new Error("No access token provided. Please reconnect your Instagram account.");
    }
    
    // Get Facebook Pages managed by the user
    const pagesResponse = await fetch(
      `https://graph.facebook.com/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${userAccessToken}`
    );
    const pagesData = await pagesResponse.json();

    if (!pagesResponse.ok) {
      throw new Error(pagesData.error?.message || "Failed to get user pages");
    }

    const pagesWithInstagram = pagesData.data.filter(
      (page) => page.instagram_business_account && page.access_token
    );

    const instagramAccounts = await Promise.all(
      pagesWithInstagram.map(async (page) => {
        const igAccountId = page.instagram_business_account.id;
        const pageAccessToken = page.access_token;

        // Now use the Page Access Token to fetch IG user details
        const igResponse = await fetch(
          `https://graph.facebook.com/${igAccountId}?fields=id,username,profile_picture_url,name&access_token=${pageAccessToken}`
        );
        const igData = await igResponse.json();

        if (!igResponse.ok) {
          console.error(`Error fetching Instagram account ${igAccountId}:`, igData.error);
          return null;
        }

        return {
          id: igData.id,
          username: igData.username,
          name: igData.name || igData.username,
          profilePicture: igData.profile_picture_url,
          pageId: page.id,
          pageName: page.name,
          pageAccessToken: page.access_token, // ✅ store for future API calls
        };
      })
    );

    return instagramAccounts.filter(account => account !== null);
  } catch (error) {
    console.error("Error getting Instagram accounts:", error);
    throw error;
  }
}

/**
 * Post media (photo, video, story, or carousel) to Instagram
 * @param {string} pageAccessToken - The Facebook Page Access Token
 * @param {string} caption - The caption for the post
 * @param {string|Array} mediaUrl - The URL of the image/video or array of URLs for carousel
 * @param {string} instagramAccountId - The Instagram account ID
 * @param {string} mediaType - The type of media ('image', 'video', 'carousel', 'story_image', 'story_video')
 * @returns {Promise} - The response from Instagram
 */
export async function postToInstagram(pageAccessToken, caption, mediaUrl, instagramAccountId, mediaType = 'image') {
  try {
    if (!pageAccessToken) {
      throw new Error("No page access token provided. Please reconnect your Instagram account.");
    }
    
    if (!instagramAccountId) {
      throw new Error("No Instagram account ID provided. Please reconnect your Instagram account.");
    }
    
    if (!mediaUrl) {
      throw new Error("No media URL provided. Please upload an image or video.");
    }
    
    console.log(`Posting ${mediaType} to Instagram with:`, {
      instagramAccountId,
      mediaType,
      mediaUrlLength: Array.isArray(mediaUrl) ? mediaUrl.length + ' items' : mediaUrl.length,
      captionLength: caption.length,
      tokenLength: pageAccessToken ? pageAccessToken.length : 0
    });
    
    // Handle carousel posts (multiple images/videos)
    if (mediaType === 'carousel' && Array.isArray(mediaUrl)) {
      return await postCarouselToInstagram(pageAccessToken, caption, mediaUrl, instagramAccountId);
    }
    
    // Step 1: Create a container
    let containerUrl;
    
    if (mediaType === 'video') {
      containerUrl = `https://graph.facebook.com/${instagramAccountId}/media?media_type=REELS&video_url=${encodeURIComponent(mediaUrl)}&caption=${encodeURIComponent(caption)}&access_token=${pageAccessToken}`;
    } else if (mediaType === 'story_image') {
      containerUrl = `https://graph.facebook.com/${instagramAccountId}/media?media_type=STORIES&image_url=${encodeURIComponent(mediaUrl)}&access_token=${pageAccessToken}`;
    } else if (mediaType === 'story_video') {
      containerUrl = `https://graph.facebook.com/${instagramAccountId}/media?media_type=STORIES&video_url=${encodeURIComponent(mediaUrl)}&access_token=${pageAccessToken}`;
    } else {
      // Default to regular image post
      containerUrl = `https://graph.facebook.com/${instagramAccountId}/media?image_url=${encodeURIComponent(mediaUrl)}&caption=${encodeURIComponent(caption)}&access_token=${pageAccessToken}`;
    }
    
    const containerResponse = await fetch(containerUrl, { method: "POST" });
    const containerData = await containerResponse.json();

    if (!containerResponse.ok) {
      console.error("Instagram container creation error:", containerData);
      throw new Error(containerData.error?.message || "Failed to create Instagram media container");
    }

    // For videos, we need to check the status before publishing
    if (mediaType === 'video' || mediaType === 'story_video') {
      let statusResponse;
      let statusData;
      let attempts = 0;
      const maxAttempts = 30; // Maximum number of attempts (30 * 2 seconds = 60 seconds max wait)
      
      do {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between checks
        
        statusResponse = await fetch(
          `https://graph.facebook.com/${containerData.id}?fields=status_code,status&access_token=${pageAccessToken}`
        );
        statusData = await statusResponse.json();
        attempts++;
        
        console.log(`Video processing status (attempt ${attempts}/${maxAttempts}):`, statusData);
        
        if (statusData.status_code === 'ERROR') {
          throw new Error(`Video processing failed: ${statusData.status || 'Unknown error'}`);
        }
        
      } while (statusData.status_code !== 'FINISHED' && attempts < maxAttempts);
      
      if (statusData.status_code !== 'FINISHED') {
        throw new Error('Video processing timed out. Please try again with a smaller or different video.');
      }
    }

    // Step 2: Publish the container
    const publishResponse = await fetch(
      `https://graph.facebook.com/${instagramAccountId}/media_publish?creation_id=${containerData.id}&access_token=${pageAccessToken}`,
      { method: "POST" }
    );
    const publishData = await publishResponse.json();
 
    if (!publishResponse.ok) {
      throw new Error(publishData.error?.message || "Failed to publish Instagram post");
    }

    return publishData;
  } catch (error) {
    console.error("Error posting to Instagram:", error);
    throw error;
  }
}

/**
 * Post a carousel (multiple images/videos) to Instagram
 * @param {string} pageAccessToken - The Facebook Page Access Token
 * @param {string} caption - The caption for the post
 * @param {Array} mediaUrls - Array of media URLs to include in the carousel
 * @param {string} instagramAccountId - The Instagram account ID
 * @returns {Promise} - The response from Instagram
 */
async function postCarouselToInstagram(pageAccessToken, caption, mediaUrls, instagramAccountId) {
  try {
    if (!Array.isArray(mediaUrls) || mediaUrls.length === 0) {
      throw new Error("No media URLs provided for carousel post");
    }
    
    if (mediaUrls.length > 10) {
      throw new Error("Instagram carousel posts can contain a maximum of 10 items");
    }
    
    console.log(`Creating carousel post with ${mediaUrls.length} items`);
    
    // Instagram carousel posts support a mix of images and videos (up to 10 items total)
    const videoUrls = mediaUrls.filter(url => typeof url === 'string' && url.match(/\.(mp4|mov|avi|wmv)$/i));
    const imageUrls = mediaUrls.filter(url => !url.match(/\.(mp4|mov|avi|wmv)$/i));
    
    console.log(`Carousel contains ${videoUrls.length} videos and ${imageUrls.length} images`);
    
    // Step 1: Create containers for each media item
    const childrenIds = [];
    
    for (let i = 0; i < mediaUrls.length; i++) {
      const mediaUrl = mediaUrls[i];
      const mediaInfo = mediaUrl.mediaInfo || {};
      const isVideo = mediaInfo.mediaType === 'video' || (typeof mediaUrl === 'string' && mediaUrl.match(/\.(mp4|mov|avi|wmv)$/i));
      
      // Create container for this media item
      let containerUrl;
      if (isVideo) {
        containerUrl = `https://graph.facebook.com/${instagramAccountId}/media?media_type=VIDEO&video_url=${encodeURIComponent(mediaUrl)}&is_carousel_item=true&access_token=${pageAccessToken}`;
      } else {
        containerUrl = `https://graph.facebook.com/${instagramAccountId}/media?media_type=IMAGE&image_url=${encodeURIComponent(mediaUrl)}&is_carousel_item=true&access_token=${pageAccessToken}`;
      }
      
      const containerResponse = await fetch(containerUrl, { method: "POST" });
      const containerData = await containerResponse.json();
      
      if (!containerResponse.ok) {
        console.error(`Error creating container for carousel item ${i + 1}:`, containerData);
        throw new Error(containerData.error?.message || `Failed to create container for carousel item ${i + 1}`);
      }
      
      // For videos, we need to check the status before proceeding
      if (isVideo) {
        let statusResponse;
        let statusData;
        let attempts = 0;
        const maxAttempts = 30; // Maximum number of attempts (30 * 2 seconds = 60 seconds max wait)
        
        do {
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between checks
          
          statusResponse = await fetch(
            `https://graph.facebook.com/${containerData.id}?fields=status_code,status&access_token=${pageAccessToken}`
          );
          statusData = await statusResponse.json();
          attempts++;
          
          console.log(`Video processing status for carousel item ${i + 1} (attempt ${attempts}/${maxAttempts}):`, statusData);
          
          if (statusData.status_code === 'ERROR') {
            throw new Error(`Video processing failed for carousel item ${i + 1}: ${statusData.status || 'Unknown error'}`);
          }
          
        } while (statusData.status_code !== 'FINISHED' && attempts < maxAttempts);
        
        if (statusData.status_code !== 'FINISHED') {
          throw new Error(`Video processing timed out for carousel item ${i + 1}. Please try again with a smaller or different video.`);
        }
      }
      
      childrenIds.push(containerData.id);
      console.log(`Created container for carousel item ${i + 1}:`, containerData.id);
    }
    
    // Step 2: Create the carousel container with all children
    const carouselUrl = `https://graph.facebook.com/${instagramAccountId}/media?media_type=CAROUSEL&caption=${encodeURIComponent(caption)}&children=${childrenIds.join(',')}&access_token=${pageAccessToken}`;
    
    const carouselResponse = await fetch(carouselUrl, { method: "POST" });
    const carouselData = await carouselResponse.json();
    
    if (!carouselResponse.ok) {
      console.error("Error creating carousel container:", carouselData);
      throw new Error(carouselData.error?.message || "Failed to create carousel container");
    }
    
    // Step 3: Publish the carousel
    const publishResponse = await fetch(
      `https://graph.facebook.com/${instagramAccountId}/media_publish?creation_id=${carouselData.id}&access_token=${pageAccessToken}`,
      { method: "POST" }
    );
    const publishData = await publishResponse.json();
    
    if (!publishResponse.ok) {
      throw new Error(publishData.error?.message || "Failed to publish Instagram carousel");
    }
    
    return publishData;
  } catch (error) {
    console.error("Error posting carousel to Instagram:", error);
    throw error;
  }
}

/**
 * Schedule a post to Instagram (requires custom logic/storage, IG API doesn't support direct scheduling)
 * @param {string} pageAccessToken - The Page Access Token
 * @param {string} caption - The caption for the post
 * @param {string|Array} mediaUrl - The URL of the image/video or array of URLs for carousel
 * @param {string} instagramAccountId - The Instagram account ID
 * @param {Date} scheduledPublishTime - When to publish the post
 * @param {string} mediaType - The type of media ('image', 'video', 'carousel', 'story_image', 'story_video')
 * @returns {Promise<Object>} - Contains containerId & scheduledTime
 */
export async function scheduleInstagramPost(pageAccessToken, caption, mediaUrl, instagramAccountId, scheduledPublishTime, mediaType = 'image') {
  try {
    if (!pageAccessToken) {
      throw new Error("No page access token provided. Please reconnect your Instagram account.");
    }
    
    if (!instagramAccountId) {
      throw new Error("No Instagram account ID provided. Please reconnect your Instagram account.");
    }
    
    if (!mediaUrl) {
      throw new Error("No media URL provided. Please upload an image or video.");
    }
    
    if (!scheduledPublishTime) {
      throw new Error("No scheduled publish time provided. Please select a time to schedule.");
    }
    
    console.log(`Scheduling Instagram ${mediaType} post with:`, {
      instagramAccountId,
      mediaType,
      mediaUrlLength: Array.isArray(mediaUrl) ? mediaUrl.length + ' items' : mediaUrl.length,
      captionLength: caption.length,
      scheduledPublishTime,
      tokenLength: pageAccessToken ? pageAccessToken.length : 0
    });
    
    // Handle carousel posts (multiple images/videos)
    if (mediaType === 'carousel' && Array.isArray(mediaUrl)) {
      const carouselContainerId = await scheduleCarouselForInstagram(pageAccessToken, caption, mediaUrl, instagramAccountId);
      return {
        containerId: carouselContainerId,
        scheduledTime: scheduledPublishTime.toISOString(),
        mediaType
      };
    }
    
    // Step 1: Create a container
    let containerUrl;
    if (mediaType === 'video') {
      containerUrl = `https://graph.facebook.com/${instagramAccountId}/media?media_type=REELS&video_url=${encodeURIComponent(mediaUrl)}&caption=${encodeURIComponent(caption)}&access_token=${pageAccessToken}`;
    } else if (mediaType === 'story_image') {
      containerUrl = `https://graph.facebook.com/${instagramAccountId}/media?media_type=STORIES&image_url=${encodeURIComponent(mediaUrl)}&access_token=${pageAccessToken}`;
    } else if (mediaType === 'story_video') {
      containerUrl = `https://graph.facebook.com/${instagramAccountId}/media?media_type=STORIES&video_url=${encodeURIComponent(mediaUrl)}&access_token=${pageAccessToken}`;
    } else {
      // Default to regular image post
      containerUrl = `https://graph.facebook.com/${instagramAccountId}/media?image_url=${encodeURIComponent(mediaUrl)}&caption=${encodeURIComponent(caption)}&access_token=${pageAccessToken}`;
    }
    
    const containerResponse = await fetch(containerUrl, { method: "POST" });
    const containerData = await containerResponse.json();

    if (!containerResponse.ok) {
      console.error("Instagram container creation error:", containerData);
      throw new Error(containerData.error?.message || "Failed to create Instagram media container");
    }

    // For videos, we need to check the status before considering it ready for scheduling
    if (mediaType === 'video' || mediaType === 'story_video') {
      let statusResponse;
      let statusData;
      let attempts = 0;
      const maxAttempts = 30; // Maximum number of attempts (30 * 2 seconds = 60 seconds max wait)
      
      do {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between checks
        
        statusResponse = await fetch(
          `https://graph.facebook.com/${containerData.id}?fields=status_code,status&access_token=${pageAccessToken}`
        );
        statusData = await statusResponse.json();
        attempts++;
        
        console.log(`Video processing status for scheduling (attempt ${attempts}/${maxAttempts}):`, statusData);
        
        if (statusData.status_code === 'ERROR') {
          throw new Error(`Video processing failed: ${statusData.status || 'Unknown error'}`);
        }
        
      } while (statusData.status_code !== 'FINISHED' && attempts < maxAttempts);
      
      if (statusData.status_code !== 'FINISHED') {
        throw new Error('Video processing timed out. Please try again with a smaller or different video.');
      }
    }

    // Save containerId and scheduledTime in your DB to publish later
    return {
      containerId: containerData.id,
      scheduledTime: scheduledPublishTime.toISOString(),
      mediaType
    };
  } catch (error) {
    console.error("Error scheduling Instagram post:", error);
    throw error;
  }
}

/**
 * Schedule a carousel post to Instagram
 * @param {string} pageAccessToken - The Facebook Page Access Token
 * @param {string} caption - The caption for the post
 * @param {Array} mediaUrls - Array of media URLs to include in the carousel
 * @param {string} instagramAccountId - The Instagram account ID
 * @returns {Promise<string>} - The container ID for later publishing
 */
async function scheduleCarouselForInstagram(pageAccessToken, caption, mediaUrls, instagramAccountId) {
  try {
    if (!Array.isArray(mediaUrls) || mediaUrls.length === 0) {
      throw new Error("No media URLs provided for carousel post");
    }
    
    if (mediaUrls.length > 10) {
      throw new Error("Instagram carousel posts can contain a maximum of 10 items");
    }
    
    console.log(`Creating scheduled carousel post with ${mediaUrls.length} items`);
    
    // Instagram carousel posts support a mix of images and videos (up to 10 items total)
    const videoUrls = mediaUrls.filter(url => typeof url === 'string' && url.match(/\.(mp4|mov|avi|wmv)$/i));
    const imageUrls = mediaUrls.filter(url => !url.match(/\.(mp4|mov|avi|wmv)$/i));
    
    console.log(`Carousel contains ${videoUrls.length} videos and ${imageUrls.length} images`);
    
    // Step 1: Create containers for each media item
    const childrenIds = [];
    
    for (let i = 0; i < mediaUrls.length; i++) {
      const mediaUrl = mediaUrls[i];
      const mediaInfo = mediaUrl.mediaInfo || {};
      const isVideo = mediaInfo.mediaType === 'video' || (typeof mediaUrl === 'string' && mediaUrl.match(/\.(mp4|mov|avi|wmv)$/i));
      
      // Create container for this media item
      let containerUrl;
      if (isVideo) {
        containerUrl = `https://graph.facebook.com/${instagramAccountId}/media?media_type=VIDEO&video_url=${encodeURIComponent(mediaUrl)}&is_carousel_item=true&access_token=${pageAccessToken}`;
      } else {
        containerUrl = `https://graph.facebook.com/${instagramAccountId}/media?media_type=IMAGE&image_url=${encodeURIComponent(mediaUrl)}&is_carousel_item=true&access_token=${pageAccessToken}`;
      }
      
      const containerResponse = await fetch(containerUrl, { method: "POST" });
      const containerData = await containerResponse.json();
      
      if (!containerResponse.ok) {
        console.error(`Error creating container for carousel item ${i + 1}:`, containerData);
        throw new Error(containerData.error?.message || `Failed to create container for carousel item ${i + 1}`);
      }
      
      // For videos, we need to check the status before proceeding
      if (isVideo) {
        let statusResponse;
        let statusData;
        let attempts = 0;
        const maxAttempts = 30; // Maximum number of attempts (30 * 2 seconds = 60 seconds max wait)
        
        do {
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds between checks
          
          statusResponse = await fetch(
            `https://graph.facebook.com/${containerData.id}?fields=status_code,status&access_token=${pageAccessToken}`
          );
          statusData = await statusResponse.json();
          attempts++;
          
          console.log(`Video processing status for carousel item ${i + 1} (attempt ${attempts}/${maxAttempts}):`, statusData);
          
          if (statusData.status_code === 'ERROR') {
            throw new Error(`Video processing failed for carousel item ${i + 1}: ${statusData.status || 'Unknown error'}`);
          }
          
        } while (statusData.status_code !== 'FINISHED' && attempts < maxAttempts);
        
        if (statusData.status_code !== 'FINISHED') {
          throw new Error(`Video processing timed out for carousel item ${i + 1}. Please try again with a smaller or different video.`);
        }
      }
      
      childrenIds.push(containerData.id);
      console.log(`Created container for carousel item ${i + 1}:`, containerData.id);
    }
    
    // Step 2: Create the carousel container with all children
    const carouselUrl = `https://graph.facebook.com/${instagramAccountId}/media?media_type=CAROUSEL&caption=${encodeURIComponent(caption)}&children=${childrenIds.join(',')}&access_token=${pageAccessToken}`;
    
    const carouselResponse = await fetch(carouselUrl, { method: "POST" });
    const carouselData = await carouselResponse.json();
    
    if (!carouselResponse.ok) {
      console.error("Error creating carousel container:", carouselData);
      throw new Error(carouselData.error?.message || "Failed to create carousel container");
    }
    
    // Return the container ID for later publishing
    return carouselData.id;
  } catch (error) {
    console.error("Error scheduling carousel for Instagram:", error);
    throw error;
  }
}

/**
 * Publish a previously created Instagram container
 * @param {string} pageAccessToken - The Page Access Token
 * @param {string} containerId - The container ID from scheduleInstagramPost
 * @param {string} instagramAccountId - The Instagram account ID
 * @returns {Promise<Object>} - The publish response
 */
export async function publishInstagramContainer(pageAccessToken, containerId) {
  try {
    if (!pageAccessToken) {
      throw new Error("No page access token provided. Please reconnect your Instagram account.");
    }
    
    if (!containerId) {
      throw new Error("No container ID provided. Container creation may have failed.");
    }
    
    console.log("Publishing Instagram container:", {
      containerId,
      tokenLength: pageAccessToken ? pageAccessToken.length : 0
    });
    
    const publishResponse = await fetch(
      `https://graph.facebook.com/me/media_publish?creation_id=${containerId}&access_token=${pageAccessToken}`,
      { method: "POST" }
    );
    const publishData = await publishResponse.json();

    if (!publishResponse.ok) {
      console.error("Instagram publish error:", publishData);
      throw new Error(publishData.error?.message || "Failed to publish Instagram container");
    }

    return publishData;
  } catch (error) {
    console.error("Error publishing Instagram container:", error);
    throw error;
  }
}
