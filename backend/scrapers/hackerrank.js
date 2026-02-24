/**
 * HackerRank profile scraper
 */

const cheerio = require("cheerio");
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
module.exports = scrapeHackerRankProfile;
