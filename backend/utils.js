/**
 * Utility functions for web scraping
 */

const winston = require("winston");
const NodeCache = require("node-cache");
const axios = require("axios");
const config = require("./config");

// Set up logging
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} - ${level}: ${message}`;
    })
  ),
  transports: [
    new winston.transports.File({ filename: "serverLogs.log" }),
    new winston.transports.Console(),
  ],
});

// Set up cache
const cache = new NodeCache({ stdTTL: config.CACHE_EXPIRY });

/**
 * Sleep function for rate limiting
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} - Promise that resolves after the specified time
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Get a random user agent from the pool
 * @returns {string} - Random user agent string
 */
const getRotatingUserAgent = () => {
  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:90.0) Gecko/20100101 Firefox/90.0",
  ];
  return userAgents[Math.floor(Math.random() * userAgents.length)];
};

/**
 * Make a safe request with rate limiting and error handling
 * @param {string} url - URL to request
 * @param {Object} options - Request options
 * @returns {Promise<Object|null>} - Response or null if failed
 */
const safeRequest = async (url, options = {}) => {
  // Apply rate limiting
  await sleep(config.RATE_LIMIT_DELAY * (0.5 + Math.random()));

  // Set up headers
  const headers = {
    ...config.REQUEST_HEADERS,
    "User-Agent": getRotatingUserAgent(),
    ...(options.headers || {}),
  };

  try {
    const response = await axios({
      url,
      method: options.method || "get",
      headers,
      timeout: config.REQUEST_TIMEOUT,
      ...(options.data ? { data: options.data } : {}),
      validateStatus: (status) => status === 200,
      family: 4,
    });

    return response;
  } catch (error) {
    logger.error(
      `Request failed for ${url}: ${JSON.stringify(error, null, 2)}`
    );
    return null;
  }
};

/**
 * Extract username from profile URL
 * @param {string} url - Profile URL
 * @returns {string} - Extracted username or "N/A"
 */
const extractUsername = (url) => {
  if (!url || url.trim() === "") {
    return "N/A";
  }

  url = url.replace(/\/$/, "");
  const parts = url.split("/");

  if (url.includes("leetcode.com")) {
    if (parts.includes("u") && parts[parts.length - 2] === "u") {
      return parts[parts.length - 1];
    }
    return parts[parts.length - 1];
  } else if (url.includes("codechef.com")) {
    return parts[parts.length - 1];
  } else if (url.includes("hackerrank.com")) {
    return parts[parts.length - 1];
  } else if (url.includes("geeksforgeeks.org")) {
    return parts[parts.length - 1];
  } else if (url.includes("github.com")) {
    return parts[parts.length - 1];
  }

  return "N/A";
};

module.exports = {
  logger,
  cache,
  sleep,
  safeRequest,
  extractUsername,
};
