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
 * Post a photo to Instagram
 * @param {string} pageAccessToken - The Facebook Page Access Token
 * @param {string} caption - The caption for the post
 * @param {string} imageUrl - The URL of the image to post
 * @param {string} instagramAccountId - The Instagram account ID
 * @returns {Promise} - The response from Instagram
 */
export async function postToInstagram(pageAccessToken, caption, imageUrl, instagramAccountId) {
  try {
    // Step 1: Create a container
    const containerResponse = await fetch(
      `https://graph.facebook.com/${instagramAccountId}/media?image_url=${encodeURIComponent(imageUrl)}&caption=${encodeURIComponent(caption)}&access_token=${pageAccessToken}`,
      { method: "POST" }
    );
    const containerData = await containerResponse.json();

    if (!containerResponse.ok) {
      throw new Error(containerData.error?.message || "Failed to create Instagram media container");
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
 * Schedule a post to Instagram (requires custom logic/storage, IG API doesn't support direct scheduling)
 * @param {string} pageAccessToken - The Page Access Token
 * @param {string} caption - The caption for the post
 * @param {string} imageUrl - The URL of the image to post
 * @param {Date} scheduledTime - When to publish the post
 * @param {string} instagramAccountId - The Instagram account ID
 * @returns {Promise<Object>} - Contains containerId & scheduledTime
 */
export async function scheduleInstagramPost(pageAccessToken, caption, imageUrl, scheduledTime, instagramAccountId) {
  try {
    const containerResponse = await fetch(
      `https://graph.facebook.com/${instagramAccountId}/media?image_url=${encodeURIComponent(imageUrl)}&caption=${encodeURIComponent(caption)}&access_token=${pageAccessToken}`,
      { method: "POST" }
    );
    const containerData = await containerResponse.json();

    if (!containerResponse.ok) {
      throw new Error(containerData.error?.message || "Failed to create Instagram media container");
    }

    // Save containerId and scheduledTime in your DB to publish later
    return {
      containerId: containerData.id,
      scheduledTime: scheduledTime.toISOString()
    };
  } catch (error) {
    console.error("Error scheduling Instagram post:", error);
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
export async function publishInstagramContainer(pageAccessToken, containerId, instagramAccountId) {
  try {
    const publishResponse = await fetch(
      `https://graph.facebook.com/${instagramAccountId}/media_publish?creation_id=${containerId}&access_token=${pageAccessToken}`,
      { method: "POST" }
    );
    const publishData = await publishResponse.json();

    if (!publishResponse.ok) {
      throw new Error(publishData.error?.message || "Failed to publish Instagram post");
    }

    return publishData;
  } catch (error) {
    console.error("Error publishing Instagram container:", error);
    throw error;
  }
}
