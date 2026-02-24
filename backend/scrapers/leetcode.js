/**
 * LeetCode profile scraper
 */

const axios = require("axios");
const { logger, extractUsername, sleep } = require("../utils");
const config = require("../config");

/**
 * Fetch data from LeetCode GraphQL API
 * @param {string} username - LeetCode username
 * @returns {Object|null} - API response data or null if failed
 */
async function fetchLeetCodeData(username) {
  if (!username || username === "N/A") {
    return null;
  }

  const query = `
  {
    matchedUser(username: "${username}") {
      submitStats {
        acSubmissionNum {
          difficulty
          count
        }
      }
      profile {
        ranking
      }
        badges{
          id        
        }
    }
    userContestRanking(username: "${username}") {
      attendedContestsCount
      rating
    }
  }
  `;

  const headers = {
    "Content-Type": "application/json",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    Referer: "https://leetcode.com/",
    Origin: "https://leetcode.com",
    Accept: "*/*",
  };

  try {
    // Add rate limiting
    await sleep(config.RATE_LIMIT_DELAY);

    const response = await axios.post(
      "https://leetcode.com/graphql",
      { query },
      {
        headers,
        timeout: config.REQUEST_TIMEOUT,
      }
    );

    if (response.status === 200) {
      const data = response.data;
      if (data.errors) {
        logger.warn(
          `[SCRAPING] LeetCode API returned errors: ${JSON.stringify(data.errors)}`
        );
        return null;
      }
      return data.data;
    } else {
      logger.error(
        `[SCRAPING] LeetCode API returned status code: ${response.status}`
      );
      return null;
    }
  } catch (error) {
    logger.error(`[SCRAPING] Error fetching LeetCode data: ${error.message}`);
    return null;
  }
}

/**
 * Scrape LeetCode profile
 * @param {string} url - Profile URL
 * @returns {Object} - Profile data
 */
async function scrapeLeetCodeProfile(url) {
  if (!url || url.trim() === "") {
    throw new Error("Invalid URL");
  }

  const username = extractUsername(url);

  if (username === "N/A") {
    throw new Error("Invalid Username");
  }

  try {
    const data = await fetchLeetCodeData(username);

    // If API fails, return default values
    if (!data) {
      throw new Error("Failed to fetch data from LeetCode");
    }

    const user = data.matchedUser || {};
    const contest = data.userContestRanking || {};

    if (!user && !contest) {
      throw new Error("No user or contest data found");
    }

    // Extract problem counts
    const submitStats = user.submitStats || {};
    const acSubmissionNum = submitStats.acSubmissionNum || [];

    const totalProblems = {};
    acSubmissionNum.forEach((submission) => {
      if (submission) {
        totalProblems[submission.difficulty] = submission.count;
      }
    });

    const problems = {
      Easy: totalProblems.Easy || 0,
      Medium: totalProblems.Medium || 0,
      Hard: totalProblems.Hard || 0,
    };

    // Extract contest data
    const contestsAttended = contest?.attendedContestsCount || 0;
    const rating = Math.round(contest?.rating || 0);
    const badgesList = user?.badges || [];
    const badgesCount = Array.isArray(badgesList) ? badgesList.length : 0;

    logger.info(
      `[SCRAPING] LeetCode data for ${username}: Rating=${rating}, Contests=${contestsAttended}, Badges=${badgesCount}`
    );

    return {
      Username: username,
      Problems: problems,
      Contests_Attended: contestsAttended,
      Rating: rating,
      Badges: badgesCount,
    };
  } catch (error) {
    logger.error(
      `[SCRAPING] Error scraping LeetCode profile: ${error.message}`
    );
    throw error;
  }
}

module.exports = scrapeLeetCodeProfile;
