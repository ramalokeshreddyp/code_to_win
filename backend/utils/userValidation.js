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
 * Validate user_id format based on role
 * @param {string} userId - User ID to validate
 * @param {string} role - User role (student, faculty, hod, admin)
 * @returns {boolean} - True if valid format
 */
function isValidUserId(userId, role = 'student') {
  const normalized = normalizeUserId(userId);
  
  // Check no spaces and alphanumeric only
  if (!/^[A-Z0-9]+$/.test(normalized) || /\s/.test(normalized)) {
    return false;
  }
  
  // Length validation based on role
  if (role === 'student') {
    return normalized.length === 10;
  }
  
  // For faculty, hod, admin - allow any length > 0
  return normalized.length > 0;
}

module.exports = {
  normalizeUserId,
  isValidUserId
};