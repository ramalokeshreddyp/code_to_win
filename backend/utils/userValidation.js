/**
 * Normalize user_id by converting to uppercase only
 * @param {string} userId - Raw user ID input
 * @returns {string} - Normalized user ID
 */
function normalizeUserId(userId) {
  if (!userId || typeof userId !== 'string') {
    return '';
  }
  
  return userId.toUpperCase();
}

/**
 * Validate user_id format (alphanumeric only, exactly 10 characters, no spaces)
 * @param {string} userId - User ID to validate
 * @returns {boolean} - True if valid format
 */
function isValidUserId(userId) {
  const normalized = normalizeUserId(userId);
  
  // Check if it's exactly 10 characters, no spaces, and contains only alphanumeric characters
  return normalized.length === 10 && 
         !/\s/.test(normalized) && 
         /^[A-Z0-9]+$/.test(normalized);
}

module.exports = {
  normalizeUserId,
  isValidUserId
};