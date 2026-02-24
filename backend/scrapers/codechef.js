/**
 * CodeChef profile scraper
 */

const cheerio = require("cheerio");
const axios = require("axios");
const { logger, sleep, extractUsername } = require("../utils");
const config = require("../config");

/**
 * Scrape CodeChef profile
 * @param {string} url - Profile URL
 * @returns {Object} - Profile data
 */
async function scrapeCodeChefProfile(url) {
  if (!url || url.trim() === "") {
    throw new Error("Invalid URL");
  }

  try {
    // Add extra delay for CodeChef to avoid rate limiting
    await sleep(5000);

    // Use rotating user agents and add more headers to avoid detection
    const headers = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      Connection: "keep-alive",
      "Upgrade-Insecure-Requests": "1",
      Referer: "https://www.google.com/",
    };

    logger.info(`[SCRAPING] Fetching CodeChef profile: ${url}`);

    const response = await axios.get(url, {
      headers,
      timeout: config.REQUEST_TIMEOUT * 2, // Double timeout for CodeChef
    });

    if (response.status !== 200) {
      logger.error(
        `[SCRAPING] CodeChef returned status code: ${response.status}`
      );
      throw new Error(`Non-200 status code: ${response.status}`);
    }

    const $ = cheerio.load(response.data);

    const username =
      $(".m-username--link").text().trim() || extractUsername(url);
    const starText = $(".rating").text().trim();
    const ratingText = $(".rating-number").text().trim();
    const totalProblemsSolvedText = $("h3").last().text().trim();

    // Extract only the first numeric value (ignoring extra characters)
    const star = parseInt(starText.match(/\d+/)?.[0]) || 0;
    const rating = parseInt(ratingText.match(/\d+/)?.[0]) || 0;

    let problemsSolved = 0;
    const match = totalProblemsSolvedText.match(
      /Total Problems Solved:\s*(\d+)/i
    );
    if (match) {
      problemsSolved = parseInt(match[1], 10);
    }

    let badges = [];
    $(".widget.badges .badge").each((index, element) => {
      const title = $(element).find(".badge__title").text().trim();

      if (title && !title.toLowerCase().includes("no badges")) {
        badges.push({
          title,
        });
      }
    });

    // Try different selectors for contests participated
    let contestsParticipated = 0;
    const contestText = $(".contest-participated-count b").text().trim();
    if (contestText) {
      contestsParticipated = parseInt(contestText) || 0;
    } else {
      // Alternative selector
      const contestSection = $('section:contains("Contest")');
      if (contestSection.length) {
        const contestCountText = contestSection.find("b").text().trim();
        contestsParticipated = parseInt(contestCountText) || 0;
      }
    }

    logger.info(
      `[SCRAPING] Successfully scraped CodeChef profile for ${username}: ${problemsSolved} problems, ${contestsParticipated} contests`
    );

    return {
      Username: username,
      Star: star,
      Rating: rating,
      Contests_Participated: contestsParticipated,
      problemsSolved: problemsSolved,
      Badges: badges.length,
    };
  } catch (error) {
    logger.error(
      `[SCRAPING] Error scraping CodeChef profile: ${error.message}`
    );
    throw error;
  }
}

module.exports = scrapeCodeChefProfile;
