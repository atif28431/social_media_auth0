/**
 * Instagram Basic Display API utilities for direct Instagram posting
 * Note: Instagram Basic Display API has limitations compared to Facebook Graph API
 * It only supports personal accounts and has restricted publishing capabilities
 */

/**
 * Post to Instagram using Instagram Basic Display API
 * Note: Basic Display API has limited posting capabilities - it only supports Stories
 * For regular posts, users need Instagram Business accounts via Facebook Graph API
 */
export async function postToInstagramDirect(mediaUrl, caption, instagramAccount) {
  try {
    if (!instagramAccount.instagram_direct_token) {
      throw new Error('Instagram Basic Display token not available');
    }

    // Instagram Basic Display API limitations:
    // - Cannot post regular posts to feed
    // - Can only create media containers for Stories (if account has permissions)
    // - Publishing requires additional permissions not available in Basic Display
    
    throw new Error(
      'Instagram Basic Display API does not support direct posting to Instagram feed. ' +
      'Please use Instagram Business account via Facebook for posting capabilities.'
    );

  } catch (error) {
    console.error('Instagram Direct posting error:', error);
    throw error;
  }
}

/**
 * Get Instagram user info using Instagram Basic Display API
 */
export async function getInstagramUserInfo(instagramAccount) {
  try {
    if (!instagramAccount.instagram_direct_token) {
      throw new Error('Instagram Basic Display token not available');
    }

    const response = await fetch(
      `https://graph.instagram.com/me?fields=id,username,account_type,media_count&access_token=${instagramAccount.instagram_direct_token}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch Instagram user info');
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Instagram user info error:', error);
    throw error;
  }
}

/**
 * Get Instagram media using Instagram Basic Display API
 */
export async function getInstagramMedia(instagramAccount) {
  try {
    if (!instagramAccount.instagram_direct_token) {
      throw new Error('Instagram Basic Display token not available');
    }

    const response = await fetch(
      `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,permalink,timestamp&access_token=${instagramAccount.instagram_direct_token}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch Instagram media');
    }

    const data = await response.json();
    return data.data || [];

  } catch (error) {
    console.error('Instagram media error:', error);
    throw error;
  }
}

/**
 * Refresh Instagram Basic Display token (if needed)
 */
export async function refreshInstagramDirectToken(instagramAccount) {
  try {
    // Instagram Basic Display tokens are long-lived (60 days)
    // and don't have a refresh mechanism like Facebook tokens
    // Users need to re-authenticate when token expires
    
    return {
      success: false,
      message: 'Instagram Basic Display tokens cannot be refreshed. Please reconnect your account.'
    };

  } catch (error) {
    console.error('Instagram token refresh error:', error);
    throw error;
  }
}

/**
 * Check if Instagram Basic Display token is valid
 */
export async function validateInstagramDirectToken(instagramAccount) {
  try {
    if (!instagramAccount.instagram_direct_token) {
      return { valid: false, error: 'No token available' };
    }

    const response = await fetch(
      `https://graph.instagram.com/me?fields=id&access_token=${instagramAccount.instagram_direct_token}`
    );

    if (response.ok) {
      return { valid: true };
    } else {
      const error = await response.json();
      return { valid: false, error: error.error?.message || 'Token invalid' };
    }

  } catch (error) {
    console.error('Instagram token validation error:', error);
    return { valid: false, error: error.message };
  }
}