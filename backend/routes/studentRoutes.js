const express = require("express");
const router = express.Router();
const db = require("../config/db"); // MySQL connection
const { logger } = require("../utils"); // <-- Add logger
const {
  scrapeAndUpdatePerformance,
} = require("../scrapers/scrapeAndUpdatePerformance");
// Profile routes
router.get("/profile", async (req, res) => {
  const userId = req.query.userId;
  logger.info(`Fetching student profile for userId: ${userId}`);
  try {
    // 1. Get student profile
    const [profileResult] = await db.query(
      `SELECT sp.*, d.dept_name
        FROM student_profiles sp
        JOIN dept d ON sp.dept_code = d.dept_code
        WHERE sp.student_id = ?`,
      [userId]
    );
    if (profileResult.length === 0) {
      logger.warn(`Profile not found for userId: ${userId}`);
      return res.status(404).json({ message: "Profile not found" });
    }
    const profile = profileResult[0];

    // 2. Get coding platform usernames
    const [codingProfileRows] = await db.query(
      `SELECT 
    leetcode_id, leetcode_status, leetcode_verified,
    codechef_id, codechef_status, codechef_verified,
    geeksforgeeks_id, geeksforgeeks_status, geeksforgeeks_verified,
    hackerrank_id, hackerrank_status, hackerrank_verified,
    verified_by
   FROM student_coding_profiles
   WHERE student_id = ?`,
      [userId]
    );
    const coding_profiles =
      codingProfileRows.length > 0 ? codingProfileRows[0] : null;

    // 3. Get performance data
    const [data] = await db.query(
      `SELECT * FROM student_performance WHERE student_id = ?`,
      [userId]
    );
    if (data.length === 0) {
      logger.warn(`No performance data found for userId: ${userId}`);
      return res.status(404).json({ message: "No performance data found" });
    }

    const p = data[0];

    // All platforms are auto-accepted
    const isLeetcodeAccepted = coding_profiles?.leetcode_id;
    const isCodechefAccepted = coding_profiles?.codechef_id;
    const isGfgAccepted = coding_profiles?.geeksforgeeks_id;
    const isHackerrankAccepted = coding_profiles?.hackerrank_id;

    const totalSolved =
      (isLeetcodeAccepted ? p.easy_lc + p.medium_lc + p.hard_lc : 0) +
      (isGfgAccepted
        ? p.school_gfg + p.basic_gfg + p.easy_gfg + p.medium_gfg + p.hard_gfg
        : 0) +
      (isCodechefAccepted ? p.problems_cc : 0);

    const combined = {
      totalSolved: totalSolved,
      totalContests:
        (isCodechefAccepted ? p.contests_cc : 0) +
        (isGfgAccepted ? p.contests_gfg : 0),
      stars_cc: isCodechefAccepted ? p.stars_cc : 0,
      badges_hr: isHackerrankAccepted ? p.badges_hr : 0,
      last_updated: p.last_updated,
    };

    const platformWise = {
      leetcode: {
        easy: isLeetcodeAccepted ? p.easy_lc : 0,
        medium: isLeetcodeAccepted ? p.medium_lc : 0,
        hard: isLeetcodeAccepted ? p.hard_lc : 0,
        contests: isLeetcodeAccepted ? p.contests_lc : 0,
        badges: isLeetcodeAccepted ? p.badges_lc : 0,
      },
      gfg: {
        school: isGfgAccepted ? p.school_gfg : 0,
        basic: isGfgAccepted ? p.basic_gfg : 0,
        easy: isGfgAccepted ? p.easy_gfg : 0,
        medium: isGfgAccepted ? p.medium_gfg : 0,
        hard: isGfgAccepted ? p.hard_gfg : 0,
        contests: isGfgAccepted ? p.contests_gfg : 0,
      },
      codechef: {
        problems: isCodechefAccepted ? p.problems_cc : 0,
        contests: isCodechefAccepted ? p.contests_cc : 0,
        stars: isCodechefAccepted ? p.stars_cc : 0,
        badges: isCodechefAccepted ? p.badges_cc : 0,
      },
      hackerrank: {
        badges: isHackerrankAccepted ? p.stars_hr : 0,
      },
    };
    logger.info(`Student profile fetched for userId: ${userId}`);
    res.json({
      ...profile,
      coding_profiles,
      performance: {
        combined,
        platformWise,
      },
    });
  } catch (err) {
    logger.error(
      `Error fetching student profile for userId=${userId}: ${err.message}`
    );
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/update-profile", async (req, res) => {
  const { userId, name, email } = req.body;
  logger.info(`Updating student profile: userId=${userId}`);
  try {
    if (!name && !email) {
      return res.status(400).json({ message: "No fields to update" });
    }

    if (name) {
      await db.query(
        `UPDATE student_profiles SET name = ? WHERE student_id = ?`,
        [name, userId]
      );
    }

    if (email) {
      await db.query(`UPDATE users SET email = ? WHERE user_id = ?`, [
        email,
        userId,
      ]);
    }

    logger.info(`Student profile updated for userId: ${userId}`);
    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    logger.error(
      `Error updating student profile for userId=${userId}: ${err.message}`
    );
    res.status(500).json({ message: "Server error" });
  }
});

router.put("/change-password", async (req, res) => {
  const { userId, currentPassword, newPassword } = req.body;
  logger.info(`Changing password for userId: ${userId}`);
  try {
    // Get current password hash
    const [user] = await db.query(
      "SELECT password FROM users WHERE user_id = ?",
      [userId]
    );

    if (user.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password (assuming plain text for now - should use bcrypt in production)
    if (user[0].password !== currentPassword) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Update password
    await db.query("UPDATE users SET password = ? WHERE user_id = ?", [
      newPassword,
      userId,
    ]);

    logger.info(`Password changed successfully for userId: ${userId}`);
    res.json({ message: "Password changed successfully" });
  } catch (err) {
    logger.error(
      `Error changing password for userId=${userId}: ${err.message}`
    );
    res.status(500).json({ message: "Server error" });
  }
});

// POST /student/coding-profile
router.post("/coding-profile", async (req, res) => {
  const { userId, leetcode_id, codechef_id, geeksforgeeks_id, hackerrank_id } =
    req.body;
  logger.info(`Submitting coding profiles: userId=${userId}`);
  try {
    // Check verification requirement
    const [settings] = await db.query(
      "SELECT setting_value FROM system_settings WHERE setting_key = 'verification_required'"
    );
    const verificationRequired = settings.length > 0 ? settings[0].setting_value === 'true' : true;
    
    const status = verificationRequired ? 'pending' : 'accepted';
    const verified = verificationRequired ? 0 : 1;
    
    // Check if the student already has a coding profile row
    const [existing] = await db.query(
      `SELECT * FROM student_coding_profiles WHERE student_id = ?`,
      [userId]
    );

    // Build dynamic update fields
    const fields = [];
    const values = [];
    const scrapeTasks = [];

    if (leetcode_id !== undefined) {
      fields.push(
        "leetcode_id = ?",
        `leetcode_status = '${status}'`,
        `leetcode_verified = ${verified}`
      );
      values.push(leetcode_id);
      if (leetcode_id && !verificationRequired) scrapeTasks.push({ platform: 'leetcode', username: leetcode_id });
    }
    if (codechef_id !== undefined) {
      fields.push(
        "codechef_id = ?",
        `codechef_status = '${status}'`,
        `codechef_verified = ${verified}`
      );
      values.push(codechef_id);
      if (codechef_id && !verificationRequired) scrapeTasks.push({ platform: 'codechef', username: codechef_id });
    }
    if (geeksforgeeks_id !== undefined) {
      fields.push(
        "geeksforgeeks_id = ?",
        `geeksforgeeks_status = '${status}'`,
        `geeksforgeeks_verified = ${verified}`
      );
      values.push(geeksforgeeks_id);
      if (geeksforgeeks_id && !verificationRequired) scrapeTasks.push({ platform: 'geeksforgeeks', username: geeksforgeeks_id });
    }
    if (hackerrank_id !== undefined) {
      fields.push(
        "hackerrank_id = ?",
        `hackerrank_status = '${status}'`,
        `hackerrank_verified = ${verified}`
      );
      values.push(hackerrank_id);
      if (hackerrank_id && !verificationRequired) scrapeTasks.push({ platform: 'hackerrank', username: hackerrank_id });
    }

    if (existing.length > 0) {
      if (fields.length > 0) {
        await db.query(
          `UPDATE student_coding_profiles SET ${fields.join(
            ", "
          )} WHERE student_id = ?`,
          [...values, userId]
        );
        logger.info(`Updated coding profiles for userId: ${userId}`);
      }
    } else {
      // Insert all fields, missing ones as null
      await db.query(
        `INSERT INTO student_coding_profiles 
         (student_id, leetcode_id, leetcode_status, leetcode_verified,
          codechef_id, codechef_status, codechef_verified,
          geeksforgeeks_id, geeksforgeeks_status, geeksforgeeks_verified,
          hackerrank_id, hackerrank_status, hackerrank_verified)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          leetcode_id || null, status, verified,
          codechef_id || null, status, verified,
          geeksforgeeks_id || null, status, verified,
          hackerrank_id || null, status, verified
        ]
      );
      logger.info(`Inserted coding profiles for userId: ${userId}`);
    }

    // Start scraping immediately if verification not required
    if (!verificationRequired) {
      scrapeTasks.forEach(({ platform, username }) => {
        scrapeAndUpdatePerformance(userId, platform, username).catch(
          (err) => logger.error(`Auto-scraping error for ${platform}: ${err.message}`)
        );
      });
    }

    const message = verificationRequired 
      ? "Coding profiles submitted for verification" 
      : "Coding profiles saved and scraping started";
    res.json({ message });
  } catch (err) {
    logger.error(
      `Error submitting coding profiles for userId=${userId}: ${err.message}`
    );
    res.status(500).json({ message: "Server error" });
  }
});

// GET /student/notifications
router.get("/notifications", async (req, res) => {
  const { userId } = req.query;
  try {
    const [notifications] = await db.query(
      `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`,
      [userId]
    );
    res.json(
      notifications.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        status: n.status,
        read: n.read_status,
        created_at: n.created_at,
      }))
    );
  } catch (err) {
    logger.error(`Error fetching notifications: ${err.message}`);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /student/refresh-coding-profiles
router.post("/refresh-coding-profiles", async (req, res) => {
  const { userId } = req.body;
  logger.info(`Refreshing coding profiles for userId: ${userId}`);
  try {
    const [profiles] = await db.query(
      `SELECT leetcode_id, leetcode_status, codechef_id, codechef_status, geeksforgeeks_id, geeksforgeeks_status, hackerrank_id, hackerrank_status
       FROM student_coding_profiles WHERE student_id = ?`,
      [userId]
    );

    if (!profiles.length) {
      return res.status(404).json({ message: "No coding profiles found" });
    }

    const profile = profiles[0];
    const tasks = [];

    if (
      profile.leetcode_id &&
      (profile.leetcode_status === "accepted" ||
        profile.leetcode_status === "suspended")
    ) {
      tasks.push(
        scrapeAndUpdatePerformance(
          userId,
          "leetcode",
          profile.leetcode_id
        ).catch((err) => logger.error(`[REFRESH] LeetCode: ${err.message}`))
      );
    }
    if (
      profile.codechef_id &&
      (profile.codechef_status === "accepted" ||
        profile.codechef_status === "suspended")
    ) {
      tasks.push(
        scrapeAndUpdatePerformance(
          userId,
          "codechef",
          profile.codechef_id
        ).catch((err) => logger.error(`[REFRESH] CodeChef: ${err.message}`))
      );
    }
    if (
      profile.geeksforgeeks_id &&
      (profile.geeksforgeeks_status === "accepted" ||
        profile.geeksforgeeks_status === "suspended")
    ) {
      tasks.push(
        scrapeAndUpdatePerformance(
          userId,
          "geeksforgeeks",
          profile.geeksforgeeks_id
        ).catch((err) => logger.error(`[REFRESH] GFG: ${err.message}`))
      );
    }
    if (
      profile.hackerrank_id &&
      (profile.hackerrank_status === "accepted" ||
        profile.hackerrank_status === "suspended")
    ) {
      tasks.push(
        scrapeAndUpdatePerformance(
          userId,
          "hackerrank",
          profile.hackerrank_id
        ).catch((err) => logger.error(`[REFRESH] HackerRank: ${err.message}`))
      );
    }

    const results = await Promise.all(tasks);

    logger.info(
      `Completed refresh for ${tasks.length} coding profiles for userId: ${userId}`
    );
    res.json({
      message: `Refreshed ${tasks.length} coding profiles`,
    });
  } catch (err) {
    logger.error(
      `Error refreshing coding profiles for userId=${userId}: ${err.message}`
    );
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
