const express = require("express");
const router = express.Router();
const db = require("../config/db"); // MySQL connection
const { logger } = require("../utils"); // <-- Add logger
const {
  scrapeAndUpdatePerformance,
} = require("../scrapers/scrapeAndUpdatePerformance");

// GET /faculty/profile
router.get("/profile", async (req, res) => {
  const { userId } = req.query;
  logger.info(`Fetching faculty profile for userId: ${userId}`);
  try {
    const [profileResult] = await db.query(
      `SELECT fp.*, d.dept_name
        FROM faculty_profiles fp
        JOIN dept d ON fp.dept_code = d.dept_code
        WHERE fp.faculty_id = ?`,
      [userId]
    );
    if (profileResult.length === 0) {
      logger.warn(`Faculty profile not found for userId: ${userId}`);
      return res.status(404).json({ message: "Faculty profile not found" });
    }
    const [assignedSections] = await db.query(
      "SELECT year, section FROM faculty_section_assignment WHERE faculty_id = ?",
      [userId]
    );

    const [[{ total_students }]] = await db.query(
      "SELECT COUNT(*) AS total_students FROM student_profiles WHERE dept_code = ? AND year = ? AND section = ?",
      [
        profileResult[0].dept_code,
        assignedSections[0].year,
        assignedSections[0].section,
      ]
    );

    logger.info(`Faculty profile fetched for userId: ${userId}`);
    res.json({ ...profileResult[0], ...assignedSections[0], total_students });
  } catch (err) {
    logger.error(
      `Error fetching faculty profile for userId=${userId}: ${err.message}`
    );
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /faculty/profile
router.put("/profile", async (req, res) => {
  const { userId, name, department, section } = req.body;
  logger.info(
    `Updating faculty profile: userId=${userId}, name=${name}, department=${department}, section=${section}`
  );
  try {
    await db.query(
      "UPDATE faculty_profiles SET name = ?, department = ?, section = ? WHERE faculty_id = ?",
      [name, department, section, userId]
    );
    logger.info(`Faculty profile updated for userId: ${userId}`);
    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    logger.error(
      `Error updating faculty profile for userId=${userId}: ${err.message}`
    );
    res.status(500).json({ message: "Server error" });
  }
});

// GET /faculty/students?dept=CSE&year=3&section=A
router.get("/students", async (req, res) => {
  const { dept, year, section } = req.query;
  logger.info(
    `Fetching students: dept=${dept}, year=${year}, section=${section}`
  );
  try {
    let query = `
      SELECT 
        sp.*, 
        d.dept_name
      FROM student_profiles sp
      JOIN dept d ON sp.dept_code = d.dept_code
      WHERE 1=1
    `;
    const params = [];
    if (dept) {
      query += " AND sp.dept_code = ?";
      params.push(dept);
    }
    if (year) {
      query += " AND sp.year = ?";
      params.push(year);
    }
    if (section) {
      query += " AND sp.section = ?";
      params.push(section);
    }

    const [students] = await db.query(query, params);

    // Attach performance for each student
    for (const student of students) {
      const [perfRows] = await db.query(
        `SELECT * FROM student_performance WHERE student_id = ?`,
        [student.student_id]
      );
      const [codingProfiles] = await db.query(
        `SELECT leetcode_id, leetcode_status, codechef_id, codechef_status, geeksforgeeks_status, hackerrank_status, github_status FROM student_coding_profiles WHERE student_id = ?`,
        [student.student_id]
      );

      student.coding_profiles = codingProfiles[0] || {};

      if (perfRows.length > 0) {
        const p = perfRows[0];
        const cp = codingProfiles[0] || {};

        const isLeetcodeAccepted = cp.leetcode_status === "accepted";
        const isCodechefAccepted = cp.codechef_status === "accepted";
        const isGfgAccepted = cp.geeksforgeeks_status === "accepted";
        const isHackerrankAccepted = cp.hackerrank_status === "accepted";
        const isGithubAccepted = cp.github_status === "accepted";

        const totalSolved =
          (isLeetcodeAccepted ? p.easy_lc + p.medium_lc + p.hard_lc : 0) +
          (isGfgAccepted
            ? p.school_gfg +
              p.basic_gfg +
              p.easy_gfg +
              p.medium_gfg +
              p.hard_gfg
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
          },
          hackerrank: {
            badges: isHackerrankAccepted ? p.stars_hr : 0,
            badgesList: isHackerrankAccepted
              ? JSON.parse(p.badgesList_hr || "[]")
              : [],
          },
          github: {
            repos: isGithubAccepted ? p.repos_gh : 0,
            contributions: isGithubAccepted ? p.contributions_gh : 0,
          },
        };

        student.performance = {
          combined,
          platformWise,
        };
      }
    }

    logger.info(`Fetched ${students.length} students`);
    res.json(students);
  } catch (err) {
    logger.error(`Error fetching students: ${err.message}`);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /faculty/coding-profile-requests?dept=CSE&year=3&section=A
router.get("/coding-profile-requests", async (req, res) => {
  const { dept, year, section } = req.query;
  try {
    const [requests] = await db.query(
      `SELECT scp.*, sp.name, sp.year, sp.section, d.dept_name
      FROM student_coding_profiles scp
      JOIN student_profiles sp ON scp.student_id = sp.student_id
      JOIN dept d ON sp.dept_code = d.dept_code
      WHERE sp.dept_code = ? AND sp.year = ? AND sp.section = ?
        AND (scp.leetcode_status = 'pending' OR scp.codechef_status = 'pending'
             OR scp.geeksforgeeks_status = 'pending' OR scp.hackerrank_status = 'pending')`,
      [dept, year, section]
    );
    res.json(requests);
  } catch (err) {
    logger.error(`Error fetching coding profile requests: ${err.message}`);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /faculty/verify-coding-profile
router.post("/verify-coding-profile", async (req, res) => {
  const { student_id, platform, action, faculty_id } = req.body;
  try {
    const status = action === "accept" ? "accepted" : "rejected";
    const verified = action === "accept" ? 1 : 0;

    await db.query(
      `UPDATE student_coding_profiles
       SET ${platform}_status = ?, ${platform}_verified = ?, verified_by = ?
       WHERE student_id = ?`,
      [status, verified, faculty_id, student_id]
    );

    res.json({ message: `Profile ${platform} ${status}` });

    // If accepted, start scraping
    if (action === "accept") {
      const [rows] = await db.query(
        `SELECT ${platform}_id FROM student_coding_profiles WHERE student_id = ?`,
        [student_id]
      );
      const username = rows[0] && rows[0][`${platform}_id`];
      if (username) {
        scrapeAndUpdatePerformance(student_id, platform, username).catch(
          (err) => logger.error(`Scraping error: ${err.message}`)
        );
      }
    }
  } catch (err) {
    logger.error(`Error verifying coding profile: ${err.message}`);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /faculty/notifications
router.get("/notifications", async (req, res) => {
  const { userId } = req.query;
  try {
    // Check if verification is required
    const [settings] = await db.query(
      "SELECT setting_value FROM system_settings WHERE setting_key = 'verification_required'"
    );
    const verificationRequired =
      settings.length > 0 ? settings[0].setting_value === "true" : true;

    if (!verificationRequired) {
      return res.json([]);
    }

    const [assignment] = await db.query(
      "SELECT year, section FROM faculty_section_assignment WHERE faculty_id = ?",
      [userId]
    );
    if (assignment.length === 0) return res.json([]);

    const [faculty] = await db.query(
      "SELECT dept_code FROM faculty_profiles WHERE faculty_id = ?",
      [userId]
    );
    if (faculty.length === 0) return res.json([]);

    const [pendingCount] = await db.query(
      `SELECT COUNT(*) as count FROM student_coding_profiles scp
       JOIN student_profiles sp ON scp.student_id = sp.student_id
       WHERE sp.dept_code = ? AND sp.year = ? AND sp.section = ?
       AND (scp.leetcode_status = 'pending' OR scp.codechef_status = 'pending'
            OR scp.geeksforgeeks_status = 'pending' OR scp.hackerrank_status = 'pending')`,
      [faculty[0].dept_code, assignment[0].year, assignment[0].section]
    );

    const count = pendingCount[0].count;
    if (count > 0) {
      res.json([
        {
          id: "pending-requests",
          title: "Pending Profile Requests",
          message: `You have ${count} coding profile request${
            count > 1 ? "s" : ""
          } to review`,
          status: "pending",
          read: false,
          created_at: new Date().toISOString(),
          count: count,
        },
      ]);
    } else {
      res.json([]);
    }
  } catch (err) {
    logger.error(`Error fetching faculty notifications: ${err.message}`);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
