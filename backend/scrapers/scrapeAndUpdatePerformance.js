const db = require("../config/db");
const { logger } = require("../utils");
const scrapeHackerRankProfile = require("./hackerrank");
const scrapeCodeChefProfile = require("./codechef");
const scrapeGeeksForGeeksProfile = require("./geeksforgeeks");
const scrapeLeetCodeProfile = require("./leetcode");

async function scrapeAndUpdatePerformance(student_id, platform, username) {
  let performanceData = null;
  let attempts = 0;
  const maxAttempts = 5;
  let success = false;

  while (attempts < maxAttempts && !success) {
    try {
      attempts++;
      if (platform === "leetcode") {
        performanceData = await scrapeLeetCodeProfile(
          `https://leetcode.com/u/${username}`
        );
        if (performanceData) {
          await db.query(
            `UPDATE student_performance SET easy_lc = ?, medium_lc = ?, hard_lc = ?, contests_lc = ?,badges_lc=?, last_updated = NOW() WHERE student_id = ?`,
            [
              performanceData?.Problems?.Easy,
              performanceData?.Problems?.Medium,
              performanceData?.Problems?.Hard,
              performanceData?.Contests_Attended,
              performanceData?.Badges,
              student_id,
            ]
          );
          // Mark as accepted if it was suspended and create notification
          const [suspendedCheck] = await db.query(
            `SELECT leetcode_status FROM student_coding_profiles WHERE student_id = ? AND leetcode_status = 'suspended'`,
            [student_id]
          );
          if (suspendedCheck.length > 0) {
            await db.query(
              `UPDATE student_coding_profiles SET leetcode_status = 'accepted' WHERE student_id = ?`,
              [student_id]
            );
            await db.query(
              `INSERT INTO notifications (user_id, title, message, status, created_at) VALUES (?, ?, ?, 'accepted', NOW())`,
              [
                student_id,
                "LeetCode Profile Reactivated",
                "Your LeetCode profile has been successfully reactivated and is now being tracked.",
              ]
            );
          }
          logger.info(
            `[SCRAPING] LeetCode performance updated for student_id=${student_id}`
          );
          success = true;
        }
      } else if (platform === "codechef") {
        performanceData = await scrapeCodeChefProfile(
          `https://www.codechef.com/users/${username}`
        );
        if (performanceData) {
          await db.query(
            `UPDATE student_performance SET contests_cc = ?, stars_cc = ?, problems_cc = ?, badges_cc = ?, last_updated = NOW() WHERE student_id = ?`,
            [
              performanceData?.Contests_Participated,
              performanceData?.Star,
              performanceData?.problemsSolved,
              performanceData?.Badges,
              student_id,
            ]
          );
          // Mark as accepted if it was suspended and create notification
          const [suspendedCheck] = await db.query(
            `SELECT codechef_status FROM student_coding_profiles WHERE student_id = ? AND codechef_status = 'suspended'`,
            [student_id]
          );
          if (suspendedCheck.length > 0) {
            await db.query(
              `UPDATE student_coding_profiles SET codechef_status = 'accepted' WHERE student_id = ?`,
              [student_id]
            );
            await db.query(
              `INSERT INTO notifications (user_id, title, message, status, created_at) VALUES (?, ?, ?, 'accepted', NOW())`,
              [
                student_id,
                "CodeChef Profile Reactivated",
                "Your CodeChef profile has been successfully reactivated and is now being tracked.",
              ]
            );
          }
          logger.info(
            `[SCRAPING] CodeChef performance updated for student_id=${student_id}`
          );
          success = true;
        }
      } else if (platform === "geeksforgeeks") {
        performanceData = await scrapeGeeksForGeeksProfile(
          `https://www.geeksforgeeks.org/user/${username}`
        );
        if (performanceData) {
          await db.query(
            `UPDATE student_performance SET school_gfg = ?, basic_gfg = ?, easy_gfg = ?, medium_gfg = ?, hard_gfg = ?, last_updated = NOW() WHERE student_id = ?`,
            [
              performanceData?.School,
              performanceData?.Basic,
              performanceData?.Easy,
              performanceData?.Medium,
              performanceData?.Hard,
              student_id,
            ]
          );
          // Mark as accepted if it was suspended and create notification
          const [suspendedCheck] = await db.query(
            `SELECT geeksforgeeks_status FROM student_coding_profiles WHERE student_id = ? AND geeksforgeeks_status = 'suspended'`,
            [student_id]
          );
          if (suspendedCheck.length > 0) {
            await db.query(
              `UPDATE student_coding_profiles SET geeksforgeeks_status = 'accepted' WHERE student_id = ?`,
              [student_id]
            );
            await db.query(
              `INSERT INTO notifications (user_id, title, message, status, created_at) VALUES (?, ?, ?, 'accepted', NOW())`,
              [
                student_id,
                "GeeksforGeeks Profile Reactivated",
                "Your GeeksforGeeks profile has been successfully reactivated and is now being tracked.",
              ]
            );
          }
          logger.info(
            `[SCRAPING] GFG performance updated for student_id=${student_id}`
          );
          success = true;
        }
      } else if (platform === "hackerrank") {
        performanceData = await scrapeHackerRankProfile(
          `https://www.hackerrank.com/profile/${username}`
        );
        if (performanceData) {
          await db.query(
            `UPDATE student_performance SET stars_hr = ?, badgesList_hr = ?, last_updated = NOW() WHERE student_id = ?`,
            [
              performanceData?.Total_stars || 0,
              JSON.stringify(performanceData?.Badges || []),
              student_id,
            ]
          );
          // Mark as accepted if it was suspended and create notification
          const [suspendedCheck] = await db.query(
            `SELECT hackerrank_status FROM student_coding_profiles WHERE student_id = ? AND hackerrank_status = 'suspended'`,
            [student_id]
          );
          if (suspendedCheck.length > 0) {
            await db.query(
              `UPDATE student_coding_profiles SET hackerrank_status = 'accepted' WHERE student_id = ?`,
              [student_id]
            );
            await db.query(
              `INSERT INTO notifications (user_id, title, message, status, created_at) VALUES (?, ?, ?, 'accepted', NOW())`,
              [
                student_id,
                "HackerRank Profile Reactivated",
                "Your HackerRank profile has been successfully reactivated and is now being tracked.",
              ]
            );
          }
          logger.info(
            `[SCRAPING] HackerRank performance updated for student_id=${student_id}`
          );
          success = true;
        }
      }
    } catch (err) {
      logger.error(
        `[SCRAPING] Attempt ${attempts}: Error scraping/updating performance for student_id=${student_id}, platform=${platform}: ${err.message}`
      );
      if (attempts >= maxAttempts) {
        // Mark as temporarily suspended instead of rejected
        const statusField = `${platform}_status`;
        try {
          await db.query(
            `UPDATE student_coding_profiles SET ${statusField} = 'suspended', last_scrape_attempt = NOW() WHERE student_id = ?`,
            [student_id]
          );

          // Create notification for student
          const title = `${
            platform.charAt(0).toUpperCase() + platform.slice(1)
          } Profile Suspended`;
          const message = `Your ${platform} profile is temporarily suspended due to connection issues. We'll retry automatically.`;

          await db.query(
            `INSERT INTO notifications (user_id, title, message, status, created_at) VALUES (?, ?, ?, 'suspended', NOW())`,
            [student_id, title, message]
          );

          logger.warn(
            `[SCRAPING] Scraping failed after ${maxAttempts} attempts. Marked as suspended for student_id=${student_id}, platform=${platform}`
          );
        } catch (updateErr) {
          logger.error(
            `[SCRAPING] Failed to update suspension for student_id=${student_id}, platform=${platform}: ${updateErr.message}`
          );
        }
      }
      // Wait a bit before retrying (optional, e.g., 1s)
      if (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }
}

async function updateAllStudentsPerformance() {
  try {
    // Get students with accepted platforms or suspended platforms ready for retry (24h cooldown)
    const [rows] = await db.query(
      `SELECT student_id, hackerrank_id, leetcode_id, codechef_id, geeksforgeeks_id,
              hackerrank_status, leetcode_status, codechef_status, geeksforgeeks_status,
              last_scrape_attempt
       FROM student_coding_profiles
       WHERE (hackerrank_status = 'accepted' OR leetcode_status = 'accepted' OR 
              codechef_status = 'accepted' OR geeksforgeeks_status = 'accepted' OR
              (hackerrank_status = 'suspended' AND (last_scrape_attempt IS NULL OR last_scrape_attempt < DATE_SUB(NOW(), INTERVAL 24 HOUR))) OR
              (leetcode_status = 'suspended' AND (last_scrape_attempt IS NULL OR last_scrape_attempt < DATE_SUB(NOW(), INTERVAL 24 HOUR))) OR
              (codechef_status = 'suspended' AND (last_scrape_attempt IS NULL OR last_scrape_attempt < DATE_SUB(NOW(), INTERVAL 24 HOUR))) OR
              (geeksforgeeks_status = 'suspended' AND (last_scrape_attempt IS NULL OR last_scrape_attempt < DATE_SUB(NOW(), INTERVAL 24 HOUR))))`
    );

    for (const row of rows) {
      if (
        row.hackerrank_id &&
        (row.hackerrank_status === "accepted" ||
          (row.hackerrank_status === "suspended" &&
            (!row.last_scrape_attempt ||
              new Date(row.last_scrape_attempt) <
                new Date(Date.now() - 24 * 60 * 60 * 1000))))
      ) {
        await scrapeAndUpdatePerformance(
          row.student_id,
          "hackerrank",
          row.hackerrank_id
        );
      }
      if (
        row.leetcode_id &&
        (row.leetcode_status === "accepted" ||
          (row.leetcode_status === "suspended" &&
            (!row.last_scrape_attempt ||
              new Date(row.last_scrape_attempt) <
                new Date(Date.now() - 24 * 60 * 60 * 1000))))
      ) {
        await scrapeAndUpdatePerformance(
          row.student_id,
          "leetcode",
          row.leetcode_id
        );
      }
      if (
        row.codechef_id &&
        (row.codechef_status === "accepted" ||
          (row.codechef_status === "suspended" &&
            (!row.last_scrape_attempt ||
              new Date(row.last_scrape_attempt) <
                new Date(Date.now() - 24 * 60 * 60 * 1000))))
      ) {
        await scrapeAndUpdatePerformance(
          row.student_id,
          "codechef",
          row.codechef_id
        );
      }
      if (
        row.geeksforgeeks_id &&
        (row.geeksforgeeks_status === "accepted" ||
          (row.geeksforgeeks_status === "suspended" &&
            (!row.last_scrape_attempt ||
              new Date(row.last_scrape_attempt) <
                new Date(Date.now() - 24 * 60 * 60 * 1000))))
      ) {
        await scrapeAndUpdatePerformance(
          row.student_id,
          "geeksforgeeks",
          row.geeksforgeeks_id
        );
      }
    }

    logger.info("[SCRAPING] Finished updating all students' coding profiles.");
  } catch (err) {
    logger.error(
      `[SCRAPING] Error updating all students' performance: ${err.message}`
    );
  }
}

module.exports = { scrapeAndUpdatePerformance, updateAllStudentsPerformance };
