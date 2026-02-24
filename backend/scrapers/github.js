/**
 * GitHub profile scraper and API fetcher
 */

const axios = require("axios");
const cheerio = require("cheerio");
const { logger, extractUsername, sleep } = require("../utils");
const config = require("../config");

/**
 * Fetch GitHub data (Hybrid approach)
 * @param {string} url - GitHub profile URL
 * @returns {Object} - Profile data (Repos and Contributions)
 */
async function scrapeGitHubProfile(url) {
  if (!url || url.trim() === "") {
    throw new Error("Invalid URL");
  }

  const username = extractUsername(url);
  if (username === "N/A" || !username) {
    throw new Error("Invalid GitHub Username");
  }

  try {
    logger.info(`[SCRAPING] Fetching GitHub statistics for: ${username}`);

    // Add rate limiting
    await sleep(config.RATE_LIMIT_DELAY);

    // 1. Fetch public repositories via official REST API
    const apiResponse = await axios.get(
      `https://api.github.com/users/${username}`,
      {
        timeout: config.REQUEST_TIMEOUT,
      }
    );

    if (apiResponse.status !== 200) {
      throw new Error(
        `GitHub API returned status code: ${apiResponse.status}`
      );
    }

    const publicRepos = apiResponse.data.public_repos || 0;

    // Add delay between requests to rate limiting
    await sleep(config.RATE_LIMIT_DELAY);

    // 2. Fetch total contributions via fragment URL (GitHub lazy-loads this)
    const profileResponse = await axios.get(
      `https://github.com/users/${username}/contributions`,
      {
        timeout: config.REQUEST_TIMEOUT,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
          "X-Requested-With": "XMLHttpRequest",
        },
      }
    );

    if (profileResponse.status !== 200) {
      throw new Error(
        `GitHub profile page returned status code: ${profileResponse.status}`
      );
    }

    const $ = cheerio.load(profileResponse.data);

    // Look for the contribution count in the header
    // Use a regex to extract the count as GitHub uses inconsistent whitespace in the HTML
    let totalContributions = 0;

    // Use a robust regex to find "X contributions in the last year"
    const match = profileResponse.data.match(
      /([\d,]+)\s+contributions\s+in\s+the\s+last\s+year/i
    );
    if (match) {
      totalContributions = parseInt(match[1].replace(/,/g, ""), 10);
    } else {
      // Fallback to text matching if regex fails on raw HTML
      const pageText = $("h2").text().trim();
      const textMatch = pageText.match(/([\d,]+)/);
      if (textMatch) {
        totalContributions = parseInt(textMatch[1].replace(/,/g, ""), 10);
      }
    }

    logger.info(
      `[SCRAPING] GitHub data for ${username}: ${publicRepos} repos, ${totalContributions} contributions`
    );

    return {
      Username: username,
      Public_Repos: publicRepos,
      Total_Contributions: totalContributions,
    };
  } catch (error) {
    logger.error(
      `[SCRAPING] Error fetching GitHub data for ${username}: ${error.message}`
    );
    throw error;
  }
}

module.exports = scrapeGitHubProfile;
