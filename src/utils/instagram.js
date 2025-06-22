/**
 * Utility functions for Instagram API interactions
 */

/**
 * Get user's Instagram accounts
 * @param {string} accessToken - The Facebook access token
 * @returns {Promise} - The response from Instagram with accounts data
 */
export async function getUserInstagramAccounts(accessToken) {
  try {
    // First, get the user's Facebook pages that have Instagram accounts connected
    const pagesResponse = await fetch(
      `https://graph.facebook.com/me/accounts?fields=name,id,instagram_business_account&access_token=${accessToken}`
    );
    const pagesData = await pagesResponse.json();

    if (!pagesResponse.ok) {
      throw new Error(pagesData.error?.message || "Failed to get user pages");
    }

    // Filter pages that have Instagram accounts connected
    const pagesWithInstagram = pagesData.data.filter(
      (page) => page.instagram_business_account
    );

    // Get details for each Instagram account
    const instagramAccounts = await Promise.all(
      pagesWithInstagram.map(async (page) => {
        const igAccountId = page.instagram_business_account.id;
        const igResponse = await fetch(
          `https://graph.facebook.com/${igAccountId}?fields=id,username,profile_picture_url,name&access_token=${accessToken}`
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
          pageAccessToken: page.access_token
        };
      })
    );

    // Filter out any null values from failed requests
    return instagramAccounts.filter(account => account !== null);
  } catch (error) {
    console.error("Error getting Instagram accounts:", error);
    throw error;
  }
}

/**
 * Post a photo to Instagram
 * @param {string} accessToken - The page access token
 * @param {string} caption - The caption for the post
 * @param {string} imageUrl - The URL of the image to post
 * @param {string} instagramAccountId - The Instagram account ID
 * @returns {Promise} - The response from Instagram
 */
export async function postToInstagram(accessToken, caption, imageUrl, instagramAccountId) {
  try {
    // Step 1: Create a container for the post
    const containerResponse = await fetch(
      `https://graph.facebook.com/${instagramAccountId}/media?image_url=${encodeURIComponent(imageUrl)}&caption=${encodeURIComponent(caption)}&access_token=${accessToken}`
    );
    const containerData = await containerResponse.json();

    if (!containerResponse.ok) {
      throw new Error(containerData.error?.message || "Failed to create Instagram media container");
    }

    // Step 2: Publish the container
    const publishResponse = await fetch(
      `https://graph.facebook.com/${instagramAccountId}/media_publish?creation_id=${containerData.id}&access_token=${accessToken}`,
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
 * Schedule a post to Instagram
 * @param {string} accessToken - The page access token
 * @param {string} caption - The caption for the post
 * @param {string} imageUrl - The URL of the image to post
 * @param {Date} scheduledTime - When to publish the post
 * @param {string} instagramAccountId - The Instagram account ID
 * @returns {Promise} - The response from Instagram
 */
export async function scheduleInstagramPost(accessToken, caption, imageUrl, scheduledTime, instagramAccountId) {
  try {
    // For Instagram, we need to store the scheduling info in our database
    // as Instagram Graph API doesn't support direct scheduling
    // We'll return the container ID which can be used later to publish
    const containerResponse = await fetch(
      `https://graph.facebook.com/${instagramAccountId}/media?image_url=${encodeURIComponent(imageUrl)}&caption=${encodeURIComponent(caption)}&access_token=${accessToken}`
    );
    const containerData = await containerResponse.json();

    if (!containerResponse.ok) {
      throw new Error(containerData.error?.message || "Failed to create Instagram media container");
    }

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
 * @param {string} accessToken - The page access token
 * @param {string} containerId - The container ID from scheduleInstagramPost
 * @param {string} instagramAccountId - The Instagram account ID
 * @returns {Promise} - The response from Instagram
 */
export async function publishInstagramContainer(accessToken, containerId, instagramAccountId) {
  try {
    const publishResponse = await fetch(
      `https://graph.facebook.com/${instagramAccountId}/media_publish?creation_id=${containerId}&access_token=${accessToken}`,
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