/**
 * HackerRank profile scraper
 */

const cheerio = require("cheerio");
const axios = require("axios");
const config = require("../config");
const { logger, safeRequest, extractUsername } = require("../utils");

/**
 * Scrape HackerRank profile
 * @param {string} url - Profile URL
 * @returns {Object} - Profile data
 */
async function scrapeHackerRankProfile(url) {
  if (!url || url.trim() === "") {
    throw new Error("Invalid URL");
  }

  try {
    const username = extractUsername(url);
    const response = await safeRequest(url);
    if (!response) {
      throw new Error("Failed to fetch HackerRank profile");
    }

    const $ = cheerio.load(response.data);

    const badges = [];
    let totalStars = 0;

    // Find badge containers
    $("svg.hexagon").each((_, element) => {
      const badgeNameTag = $(element).find("text.badge-title");
      const badgeName = badgeNameTag.length
        ? badgeNameTag.text().trim()
        : "Unknown Badge";

      const starSection = $(element).find("g.star-section");
      const starCount = starSection.length
        ? starSection.find("svg.badge-star").length
        : 0;

      totalStars += starCount;
      badges.push({ name: badgeName, stars: starCount });
    });

    // Find certifications
    const certifications = [];
    $("h2.certificate_v3-heading").each((_, element) => {
      certifications.push($(element).text().trim());
    });

    logger.info(
      `[SCRAPING] HackerRank data for ${username}: ${badges.length} badges, ${totalStars} stars`
    );

    return {
      Username: username,
      Badges: badges,
      Certifications: certifications,
      Total_Badges: badges.length,
      Total_Stars: totalStars,
    };
  } catch (error) {
    logger.error(
      `[SCRAPING] Error scraping HackerRank profile: ${error.message}`
    );
    throw error;
  }
}

/**
 * Fetch the short bio from a HackerRank profile — used for ownership verification.
 * @param {string} username - HackerRank username
 * @returns {string|null}
 */
async function fetchHackerRankBio(username) {
  if (!username || username === "N/A") return null;

  // Use HackerRank's REST API — returns short_bio directly (no JS rendering needed)
  const url = `https://www.hackerrank.com/rest/hackers/${username}`;

  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: config.REQUEST_TIMEOUT,
    });

    if (response.status !== 200) return null;

    const data = response.data.model || response.data;
    // HackerRank stores the headline below the name in "jobs_headline"
    const bio = data.jobs_headline || data.short_bio || "";

    logger.info(
      `[VERIFY] HackerRank bio fetched for ${username}: "${(bio || "").substring(0, 50)}..."`
    );
    return bio;
  } catch (error) {
    logger.error(
      `[VERIFY] Error fetching HackerRank bio for ${username}: ${error.message}`
    );
    return null;
  }
}

module.exports = { scrapeHackerRankProfile, fetchHackerRankBio };
