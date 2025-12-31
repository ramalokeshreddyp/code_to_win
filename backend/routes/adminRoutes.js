const express = require("express");
const router = express.Router();
const db = require("../config/db"); // MySQL connection
const bcrypt = require("bcryptjs");
const { logger } = require("../utils"); // <-- Add logger

// GET /admin/profile
router.get("/profile", async (req, res) => {
  const { userId } = req.query;
  logger.info(`Fetching admin profile for userId: ${userId}`);
  try {
    // Get admin profile with email
    const [profileResult] = await db.query(
      `SELECT ap.*, u.email 
       FROM admin_profiles ap
       JOIN users u ON ap.admin_id = u.user_id
       WHERE ap.admin_id = ?`,
      [userId]
    );
    if (profileResult.length === 0) {
      logger.warn(`Admin profile not found for userId: ${userId}`);
      return res.status(404).json({ message: "Admin profile not found" });
    }
    const profile = profileResult[0];

    // Get total students
    const [[{ total_students }]] = await db.query(
      "SELECT COUNT(*) AS total_students FROM student_profiles"
    );

    //Get total students in each department
    const [students_per_dept] = await db.query(
      `SELECT d.dept_name, COUNT(sp.student_id) AS student_count
       FROM dept d
       LEFT JOIN student_profiles sp ON d.dept_code = sp.dept_code
       GROUP BY d.dept_code, d.dept_name`
    );
    profile.students_per_dept = students_per_dept;

    // Get total faculty
    const [[{ total_faculty }]] = await db.query(
      "SELECT COUNT(*) AS total_faculty FROM faculty_profiles"
    );

    // Get total HODs
    const [[{ total_hod }]] = await db.query(
      "SELECT COUNT(*) AS total_hod FROM hod_profiles"
    );

    // Get today's visitor statistics
    const [[visitorStats]] = await db.query(
      "SELECT COALESCE(visitor_count, 0) as today_visits, COALESCE(unique_visitors, 0) as today_unique_visitors FROM visitor_stats WHERE visit_date = CURDATE()"
    );

    // Get live visitors (active in last 5 minutes)
    const [[liveVisitors]] = await db.query(
      "SELECT COUNT(*) as live_visitors FROM visitor_sessions WHERE is_active = 1 AND last_visit >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)"
    );

    logger.info(`Admin profile fetched for userId: ${userId}`);
    res.json({
      ...profile,
      total_students,
      students_per_dept,
      total_faculty,
      total_hod,
      visitor_stats: {
        today_visits: visitorStats?.today_visits || 0,
        today_unique_visitors: visitorStats?.today_unique_visitors || 0,
        live_visitors: liveVisitors?.live_visitors || 0,
      },
    });
  } catch (err) {
    logger.error(
      `Error fetching admin profile for userId ${userId}: ${err.message}`
    );
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /hod/profile
router.put("/profile", async (req, res) => {
  const { userId, name, department, section } = req.body;
  logger.info(
    `Updating HOD profile: userId=${userId}, name=${name}, department=${department}, section=${section}`
  );
  try {
    await db.query(
      "UPDATE hod_profiles SET name = ?, dept = ? WHERE hod_id = ?",
      [name, department, section, userId]
    );
    logger.info(`HOD profile updated for userId: ${userId}`);
    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    logger.error(
      `Error updating HOD profile for userId ${userId}: ${err.message}`
    );
    res.status(500).json({ message: "Server error" });
  }
});

// GET /admin/students - Fetch all students for admin
router.get("/students", async (req, res) => {
  logger.info("Fetching all students for admin");
  try {
    const query = `
      SELECT sp.*, u.email, d.dept_name
      FROM student_profiles sp
      JOIN users u ON sp.student_id = u.user_id
      JOIN dept d ON sp.dept_code = d.dept_code
      ORDER BY sp.name ASC
    `;
    const [students] = await db.query(query);

    // Attach performance for each student
    for (const student of students) {
      const [perfRows] = await db.query(
        `SELECT * FROM student_performance WHERE student_id = ?`,
        [student.student_id]
      );
      const [codingProfiles] = await db.query(
        `SELECT leetcode_status, codechef_status, geeksforgeeks_status, hackerrank_status FROM student_coding_profiles WHERE student_id = ?`,
        [student.student_id]
      );

      student.coding_profiles = codingProfiles[0];

      if (perfRows.length > 0) {
        const p = perfRows[0];
        const cp = codingProfiles[0] || {};

        const isLeetcodeAccepted = cp.leetcode_status === "accepted";
        const isCodechefAccepted = cp.codechef_status === "accepted";
        const isGfgAccepted = cp.geeksforgeeks_status === "accepted";
        const isHackerrankAccepted = cp.hackerrank_status === "accepted";

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
        };

        student.performance = {
          combined,
          platformWise,
        };
      }
    }

    logger.info(`Fetched ${students.length} students for admin`);
    res.json(students);
  } catch (err) {
    logger.error(`Error fetching students for admin: ${err.message}`);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /hod/faculty?dept=CSE
router.get("/faculty", async (req, res) => {
  const { dept } = req.query;
  logger.info(`Fetching faculty: dept=${dept}`);
  try {
    let query = `
      SELECT fp.*, u.email 
      FROM faculty_profiles fp
      JOIN users u ON fp.faculty_id = u.user_id
      WHERE 1=1
    `;
    const params = [];
    if (dept) {
      query += " AND fp.dept_code = ?";
      params.push(dept);
    }
    const [faculty] = await db.query(query, params);
    logger.info(`Fetched ${faculty.length} faculty`);
    res.json(faculty);
  } catch (err) {
    logger.error(`Error fetching faculty: ${err.message}`);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /admin/hods?dept=CSE
router.get("/hods", async (req, res) => {
  const { dept } = req.query;
  logger.info(`Fetching HODs: dept=${dept}`);
  try {
    let query = `
      SELECT hp.*, u.email 
      FROM hod_profiles hp
      JOIN users u ON hp.hod_id = u.user_id
      WHERE 1=1
    `;
    const params = [];
    if (dept) {
      query += " AND hp.dept_code = ?";
      params.push(dept);
    }
    const [hods] = await db.query(query, params);
    logger.info(`Fetched ${hods.length} HODs`);
    res.json(hods);
  } catch (err) {
    logger.error(`Error fetching HODs: ${err.message}`);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /admin/faculty/:id - Update faculty
router.put("/faculty/:id", async (req, res) => {
  const { id } = req.params;
  const { name, email, dept_code } = req.body;
  logger.info(
    `Updating faculty ${id}: name=${name}, email=${email}, dept_code=${dept_code}`
  );

  try {
    // Update faculty profile
    await db.query(
      "UPDATE faculty_profiles SET name = ?, dept_code = ? WHERE faculty_id = ?",
      [name, dept_code, id]
    );

    // Update email in users table
    await db.query("UPDATE users SET email = ? WHERE user_id = ?", [email, id]);

    logger.info(`Faculty ${id} updated successfully`);
    res.json({ message: "Faculty updated successfully" });
  } catch (err) {
    logger.error(`Error updating faculty ${id}: ${err.message}`);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /admin/faculty/:id - Delete faculty
router.delete("/faculty/:id", async (req, res) => {
  const { id } = req.params;
  logger.info(`Deleting faculty ${id}`);

  try {
    // Start a transaction
    await db.query("START TRANSACTION");

    // Delete from faculty_profiles
    await db.query(
      "DELETE FROM faculty_section_assignment WHERE faculty_id = ?",
      [id]
    );
    await db.query("DELETE FROM faculty_profiles WHERE faculty_id = ?", [id]);

    // Delete from users table
    await db.query("DELETE FROM users WHERE user_id = ?", [id]);

    // Commit the transaction
    await db.query("COMMIT");

    logger.info(`Faculty ${id} deleted successfully`);
    res.json({ message: "Faculty deleted successfully" });
  } catch (err) {
    // Rollback on error
    await db.query("ROLLBACK");
    logger.error(`Error deleting faculty ${id}: ${err.message}`);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /admin/update-student - Update student info
router.post("/update-student", async (req, res) => {
  const { userId, name, email, year, section, dept_code, degree } = req.body;
  logger.info(`Admin updating student: userId=${userId}`);
  try {
    // Update student_profiles table
    const profileFields = [];
    const profileValues = [];

    if (name) {
      profileFields.push("name = ?");
      profileValues.push(name);
    }
    if (year) {
      profileFields.push("year = ?");
      profileValues.push(year);
    }
    if (section) {
      profileFields.push("section = ?");
      profileValues.push(section);
    }
    if (dept_code) {
      profileFields.push("dept_code = ?");
      profileValues.push(dept_code);
    }
    if (degree) {
      profileFields.push("degree = ?");
      profileValues.push(degree);
    }

    if (profileFields.length > 0) {
      profileValues.push(userId);
      await db.query(
        `UPDATE student_profiles SET ${profileFields.join(
          ", "
        )} WHERE student_id = ?`,
        profileValues
      );
    }

    // Update users table for email
    if (email) {
      await db.query("UPDATE users SET email = ? WHERE user_id = ?", [
        email,
        userId,
      ]);
    }

    logger.info(`Student updated by admin: userId=${userId}`);
    res.json({ message: "Student updated successfully" });
  } catch (err) {
    logger.error(`Error updating student for admin: ${err.message}`);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /admin/hods/:id - Update HOD
router.put("/hods/:id", async (req, res) => {
  const { id } = req.params;
  const { name, email, dept_code } = req.body;
  logger.info(
    `Updating HOD ${id}: name=${name}, email=${email}, dept_code=${dept_code}`
  );

  try {
    // Update HOD profile
    await db.query(
      "UPDATE hod_profiles SET name = ?, dept_code = ? WHERE hod_id = ?",
      [name, dept_code, id]
    );

    // Update email in users table
    await db.query("UPDATE users SET email = ? WHERE user_id = ?", [email, id]);

    logger.info(`HOD ${id} updated successfully`);
    res.json({ message: "HOD updated successfully" });
  } catch (err) {
    logger.error(`Error updating HOD ${id}: ${err.message}`);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /admin/hods/:id - Delete HOD
router.delete("/hods/:id", async (req, res) => {
  const { id } = req.params;
  logger.info(`Deleting HOD ${id}`);

  try {
    // Start a transaction
    await db.query("START TRANSACTION");

    // Delete from hod_profiles
    await db.query("DELETE FROM hod_profiles WHERE hod_id = ?", [id]);

    // Delete from users table
    await db.query("DELETE FROM users WHERE user_id = ?", [id]);

    // Commit the transaction
    await db.query("COMMIT");

    logger.info(`HOD ${id} deleted successfully`);
    res.json({ message: "HOD deleted successfully" });
  } catch (err) {
    // Rollback on error
    await db.query("ROLLBACK");
    logger.error(`Error deleting HOD ${id}: ${err.message}`);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /admin/settings - Get system settings (SA07 only)
router.get("/settings", async (req, res) => {
  const { userId } = req.query;
  if (userId !== "SA07") {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const [settings] = await db.query(
      "SELECT * FROM system_settings WHERE setting_key = 'verification_required'"
    );
    const verificationRequired =
      settings.length > 0 ? settings[0].setting_value === "true" : true;

    res.json({ verification_required: verificationRequired });
  } catch (err) {
    logger.error(`Error fetching settings: ${err.message}`);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /admin/toggle-verification - Toggle verification requirement (SA07 only)
router.post("/toggle-verification", async (req, res) => {
  const { userId, enabled } = req.body;
  if (userId !== "SA07") {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    await db.query(
      "INSERT INTO system_settings (setting_key, setting_value, updated_by) VALUES ('verification_required', ?, ?) ON DUPLICATE KEY UPDATE setting_value = ?, updated_by = ?",
      [enabled ? "true" : "false", userId, enabled ? "true" : "false", userId]
    );

    logger.info(
      `Verification requirement ${
        enabled ? "enabled" : "disabled"
      } by ${userId}`
    );
    res.json({ message: `Verification ${enabled ? "enabled" : "disabled"}` });
  } catch (err) {
    logger.error(`Error toggling verification: ${err.message}`);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
