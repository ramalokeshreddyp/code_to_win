/**
 * GitHub profile scraper and API fetcher
 */

const axios = require("axios");
const cheerio = require("cheerio");
const { logger, extractUsername, sleep } = require("../utils");
const config = require("../config");

const buildHeaders = (extraHeaders = {}) => ({
  ...config.REQUEST_HEADERS,
  ...extraHeaders,
});

const parseCounterText = (text = "") => {
  const numeric = String(text).replace(/[^\d]/g, "");
  return numeric ? parseInt(numeric, 10) : 0;
};

const parsePublicReposFromProfileHtml = (html) => {
  const $ = cheerio.load(html);

  const repoCounter =
    $("a[href$='?tab=repositories'] span.Counter").first().text().trim() ||
    $("a[href$='?tab=repositories'] .Counter").first().text().trim() ||
    $("a[data-tab-item='repositories'] .Counter").first().text().trim();

  return parseCounterText(repoCounter);
};

const parseContributionsFromHtml = (html) => {
  const $ = cheerio.load(html);

  const match = String(html).match(
    /([\d,]+)\s+contributions\s+in\s+the\s+last\s+year/i
  );
  if (match) {
    return parseInt(match[1].replace(/,/g, ""), 10);
  }

  // Fallback for minor markup shifts where the count appears in heading text.
  const headingText = $("h2").text().trim();
  const headingMatch = headingText.match(/([\d,]+)/);
  if (headingMatch) {
    return parseInt(headingMatch[1].replace(/,/g, ""), 10);
  }

  return 0;
};

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

    // 1. Try GitHub REST API for repo count first.
    let publicRepos = 0;
    let repoSource = "api";
    const apiHeaders = buildHeaders(
      process.env.GITHUB_TOKEN
        ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
        : {}
    );

    try {
      const apiResponse = await axios.get(
        `https://api.github.com/users/${username}`,
        {
          timeout: config.REQUEST_TIMEOUT,
          headers: apiHeaders,
        }
      );

      if (apiResponse.status === 200) {
        publicRepos = apiResponse.data.public_repos || 0;
      } else {
        throw new Error(`GitHub API returned status code: ${apiResponse.status}`);
      }
    } catch (apiErr) {
      const status = apiErr?.response?.status;
      if (status === 404) {
        throw new Error("GitHub profile not found");
      }

      repoSource = "html";
      logger.warn(
        `[SCRAPING] GitHub API unavailable for ${username}. Falling back to profile HTML: ${apiErr.message}`
      );

      const profilePageResponse = await axios.get(`https://github.com/${username}`, {
        timeout: config.REQUEST_TIMEOUT,
        headers: buildHeaders(),
      });

      if (profilePageResponse.status !== 200) {
        throw new Error(
          `GitHub profile page returned status code: ${profilePageResponse.status}`
        );
      }

      publicRepos = parsePublicReposFromProfileHtml(profilePageResponse.data);
    }

    // Add delay between requests to rate limiting
    await sleep(config.RATE_LIMIT_DELAY);

    // 2. Fetch total contributions via fragment URL (GitHub lazy-loads this)
    let totalContributions = 0;
    try {
      const profileResponse = await axios.get(
        `https://github.com/users/${username}/contributions`,
        {
          timeout: config.REQUEST_TIMEOUT,
          headers: buildHeaders({ "X-Requested-With": "XMLHttpRequest" }),
        }
      );

      if (profileResponse.status === 404) {
        throw new Error("GitHub profile not found");
      }

      if (profileResponse.status !== 200) {
        throw new Error(
          `GitHub profile page returned status code: ${profileResponse.status}`
        );
      }

      totalContributions = parseContributionsFromHtml(profileResponse.data);
    } catch (contributionErr) {
      if (contributionErr.message === "GitHub profile not found") {
        throw contributionErr;
      }

      logger.warn(
        `[SCRAPING] Could not fetch contributions for ${username}, defaulting to 0: ${contributionErr.message}`
      );
    }

    logger.info(
      `[SCRAPING] GitHub data for ${username}: ${publicRepos} repos, ${totalContributions} contributions (repos source: ${repoSource})`
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
