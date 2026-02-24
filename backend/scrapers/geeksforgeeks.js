/**
 * GeeksForGeeks profile scraper
 * Uses Puppeteer because GFG profile pages use JavaScript rendering
 */

const puppeteer = require("puppeteer");
const { logger, sleep } = require("../utils");
const config = require("../config");

/**
 * Scrape GeeksForGeeks profile using Puppeteer
 * @param {string} url - Profile URL
 * @returns {Object} - Profile data
 */
async function scrapeGeeksForGeeksProfile(url) {
  if (!url || url.trim() === "") {
    throw new Error("Invalid URL");
  }

  // Normalize URL to use the activity tab where stats are shown
  url = url.trim();
  
  // Convert /user/ URLs to /profile/ (GFG's current URL format)
  url = url.replace(/\/user\//, "/profile/");
  
  // Add tab=activity if not already present
  if (!url.includes("tab=")) {
    // Handle trailing slashes and existing query parameters
    if (url.includes("?")) {
      url = url + "&tab=activity";
    } else {
      url = url.replace(/\/$/, "") + "?tab=activity";
    }
  }

  let browser = null;
  try {
    // Add rate limiting
    await sleep(config.RATE_LIMIT_DELAY);

    logger.info(`[SCRAPING] Fetching GeeksForGeeks profile: ${url}`);

    browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    // Set viewport and user agent
    await page.setViewport({ width: 1280, height: 720 });
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    );

    // Navigate to the URL with timeout
    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: config.REQUEST_TIMEOUT,
    });

    // Wait for page to fully render
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Explicitly wait for the problem breakdown section to be visible
    try {
      await page.waitForFunction(
        () => {
          const text = document.body.innerText;
          // Check if either the activity tab data or problem breakdown is present
          return text.includes("Problems Breakdown") || 
                 text.includes("SCHOOL") || 
                 text.includes("BASIC") ||
                 text.includes("Problems Solved");
        },
        { timeout: 8000 }
      );
    } catch (e) {
      logger.warn(`[SCRAPING] Profile data section not found for ${url}, continuing with available data`);
    }

    // Add extra wait for slow connections
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Extract data using page.evaluate
    const profileData = await page.evaluate(() => {
      const result = {
        username: "N/A",
        school: 0,
        basic: 0,
        easy: 0,
        medium: 0,
        hard: 0,
      };

      // Extract username from the page
      const usernameElements = [
        document.querySelector("h2")?.textContent,
        document.querySelector("h1")?.textContent,
        document.querySelector("[class*='profile']")?.getAttribute("data-user"),
      ];

      for (const elem of usernameElements) {
        if (elem && elem.trim()) {
          result.username = elem.trim();
          break;
        }
      }

      // Get all text content
      const pageText = document.body.innerText;

      // Try to find the problem breakdown section
      // The section looks like: "SCHOOL (0)" "BASIC (164)" etc
      // Use regex that handles case-insensitive matching and various spacing
      
      // Pattern 1: Look for "SCHOOL (number)" format
      let match = pageText.match(/SCHOOL\s*\(\s*(\d+)\s*\)/i);
      if (match) result.school = parseInt(match[1], 10);
      
      // Pattern 2: Look for "BASIC (number)" format  
      match = pageText.match(/BASIC\s*\(\s*(\d+)\s*\)/i);
      if (match) result.basic = parseInt(match[1], 10);
      
      // Pattern 3: Look for "EASY (number)" format
      match = pageText.match(/EASY\s*\(\s*(\d+)\s*\)/i);
      if (match) result.easy = parseInt(match[1], 10);
      
      // Pattern 4: Look for "MEDIUM (number)" format
      match = pageText.match(/MEDIUM\s*\(\s*(\d+)\s*\)/i);
      if (match) result.medium = parseInt(match[1], 10);
      
      // Pattern 5: Look for "HARD (number)" format
      match = pageText.match(/HARD\s*\(\s*(\d+)\s*\)/i);
      if (match) result.hard = parseInt(match[1], 10);

      return result;
    });

    await browser.close();

    if (profileData.username === "N/A") {
      throw new Error("Username not found in profile");
    }

    logger.info(
      `[SCRAPING] GeeksForGeeks data for ${profileData.username}: [S:${profileData.school},B:${profileData.basic},E:${profileData.easy},M:${profileData.medium},H:${profileData.hard}]`
    );
    
    // Check if all values are 0 (likely page parsing issue)
    const totalProblems = profileData.school + profileData.basic + profileData.easy + profileData.medium + profileData.hard;
    if (totalProblems === 0 && profileData.username !== "N/A") {
      logger.warn(
        `[SCRAPING] ⚠️  All difficulty levels are 0 for ${profileData.username} - page might not have loaded problem data`
      );
    }

    return {
      Username: profileData.username,
      School: profileData.school,
      Basic: profileData.basic,
      Easy: profileData.easy,
      Medium: profileData.medium,
      Hard: profileData.hard,
    };
  } catch (error) {
    if (browser) {
      await browser.close().catch(() => {});
    }
    logger.error(
      `[SCRAPING] Error scraping GeeksForGeeks profile: ${error.message}`
    );
    throw error;
  }
}

module.exports = scrapeGeeksForGeeksProfile;
