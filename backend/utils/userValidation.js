/**
 * Normalize user_id by removing spaces and converting to uppercase
 * @param {string} userId - Raw user ID input
 * @returns {string} - Normalized user ID
 */
function normalizeUserId(userId) {
  if (!userId || typeof userId !== 'string') {
    return '';
  }
  
  return userId
    .trim()                    // Remove leading/trailing spaces
    .replace(/\s+/g, '')       // Remove all spaces
    .toUpperCase();            // Convert to uppercase
}

/**
 * Validate user_id format (alphanumeric only, exactly 10 characters)
 * @param {string} userId - User ID to validate
 * @returns {boolean} - True if valid format
 */
function isValidUserId(userId) {
  const normalized = normalizeUserId(userId);
  
  // Check if it's exactly 10 characters and contains only alphanumeric characters
  return normalized.length === 10 && /^[A-Z0-9]+$/.test(normalized);
}

module.exports = {
  normalizeUserId,
  isValidUserId
};