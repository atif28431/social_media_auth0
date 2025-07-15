/**
 * Utility functions for user profile handling
 */

/**
 * Generate user initials from user data
 * @param {Object} user - User object from Auth0
 * @returns {string} User initials (e.g., "AA" for "Atif Ansari")
 */
export const getUserInitials = (user) => {
  if (!user) return 'U';
  
  // Try to get initials from name
  if (user.name) {
    const names = user.name.trim().split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    } else if (names.length === 1) {
      return names[0].substring(0, 2).toUpperCase();
    }
  }
  
  // Fallback to given_name and family_name
  if (user.given_name && user.family_name) {
    return (user.given_name[0] + user.family_name[0]).toUpperCase();
  }
  
  // Fallback to first two letters of given_name or nickname
  if (user.given_name) {
    return user.given_name.substring(0, 2).toUpperCase();
  }
  
  if (user.nickname) {
    return user.nickname.substring(0, 2).toUpperCase();
  }
  
  // Final fallback
  return 'U';
};

/**
 * Get user display name
 * @param {Object} user - User object from Auth0
 * @returns {string} User display name
 */
export const getUserDisplayName = (user) => {
  return user?.name || user?.nickname || 'User';
};

/**
 * Get user email
 * @param {Object} user - User object from Auth0
 * @returns {string} User email
 */
export const getUserEmail = (user) => {
  return user?.email || 'No email';
};

/**
 * Get user profile image URL
 * @param {Object} user - User object from Auth0
 * @returns {string|null} Profile image URL or null if not available
 */
export const getUserProfileImage = (user) => {
  return user?.picture || user?.avatar || null;
};
