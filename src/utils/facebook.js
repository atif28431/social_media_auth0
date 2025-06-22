/**
 * Utility functions for Facebook API interactions
 */

/**
 * Post a message to Facebook
 * @param {string} accessToken - The Facebook access token
 * @param {string} message - The message to post
 * @param {string} pageId - Optional page ID if posting to a page
 * @returns {Promise} - The response from Facebook
 */
export async function postToFacebook(accessToken, message, pageId = null) {
  try {
    if (pageId) {
      // Use the provided accessToken directly (should be a page access token)
      const endpoint = `https://graph.facebook.com/${pageId}/feed`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          access_token: accessToken,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to post to Facebook");
      }
      return data;
    } else {
      // For personal timeline posts, we need to inform the user to use the Share Dialog
      // as direct posting to personal timelines is no longer supported by Facebook
      throw new Error(
        "Posting directly to personal timelines is no longer supported by Facebook. " +
          "Facebook requires using the Share Dialog for posting to personal timelines. " +
          "Please use the Share Dialog feature instead."
      );
    }
  } catch (error) {
    console.error("Error posting to Facebook:", error);
    throw error;
  }
}

/**
 * Schedule a post to Facebook
 * @param {string} accessToken - The Facebook access token
 * @param {string} message - The message to post
 * @param {Date} scheduledTime - When to publish the post
 * @param {string} pageId - Optional page ID if posting to a page
 * @returns {Promise} - The response from Facebook
 */
export async function schedulePost(
  accessToken,
  message,
  scheduledTime,
  pageId = null
) {
  try {
    let endpoint;
    if (pageId) {
      // Use the provided accessToken directly (should be a page access token)
      endpoint = `https://graph.facebook.com/${pageId}/feed`;
    } else {
      endpoint = "https://graph.facebook.com/me/feed";
    }
    // Convert to Unix timestamp
    const publishTime = Math.floor(scheduledTime.getTime() / 1000);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        published: false,
        scheduled_publish_time: publishTime,
        access_token: accessToken,
      }),
    });
    const data = await response.json();
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
 * Get user's Facebook pages
 * @param {string} accessToken - The Facebook access token
 * @returns {Promise} - The response from Facebook with pages data
 */
export async function getUserPages(accessToken) {
  try {
    const response = await fetch(
      `https://graph.facebook.com/me/accounts?access_token=${accessToken}`
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
