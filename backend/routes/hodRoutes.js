const express = require("express");
const router = express.Router();
const db = require("../config/db"); // MySQL connection
const { logger } = require("../utils"); // <-- Add logger

// GET /hod/profile
router.get("/profile", async (req, res) => {
  const { userId } = req.query;
  logger.info(`Fetching HOD profile for userId: ${userId}`);
  try {
    // Get HOD profile
    const [profileResult] = await db.query(
      `SELECT hp.*, d.dept_name
        FROM hod_profiles hp
        JOIN dept d ON hp.dept_code = d.dept_code
        WHERE hp.hod_id = ?`,
      [userId]
    );
    if (profileResult.length === 0) {
      logger.warn(`HOD profile not found for userId: ${userId}`);
      return res.status(404).json({ message: "HOD profile not found" });
    }
    const profile = profileResult[0];
    // Get department from profile
    const dept = profile.dept_code;

    // Get total students in dept
    const [[{ total_students }]] = await db.query(
      "SELECT COUNT(*) AS total_students FROM student_profiles WHERE dept_code = ?",
      [dept]
    );

    // Get total faculty in dept
    const [[{ total_faculty }]] = await db.query(
      "SELECT COUNT(*) AS total_faculty FROM faculty_profiles WHERE dept_code = ?",
      [dept]
    );

    // Get total unique sections in dept (across all years)
    const [[{ total_sections }]] = await db.query(
      "SELECT COUNT(DISTINCT fsa.faculty_id) AS total_sections FROM faculty_profiles fp JOIN faculty_section_assignment fsa ON fp.faculty_id = fsa.faculty_id WHERE fp.dept_code = ?",
      [dept]
    );

    logger.info(`HOD profile fetched for userId: ${userId}`);
    res.json({
      ...profile,
      total_students,
      total_faculty,
      total_sections,
    });
  } catch (err) {
    logger.error(
      `Error fetching HOD profile for userId=${userId}: ${err.message}`
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
      `Error updating HOD profile for userId=${userId}: ${err.message}`
    );
    res.status(500).json({ message: "Server error" });
  }
});

// GET /hod/students?dept=CSE&year=3&section=A
router.get("/students", async (req, res) => {
  const { dept, year, section } = req.query;
  logger.info(
    `Fetching students: dept=${dept}, year=${year}, section=${section}`
  );
  try {
    let query = `
      SELECT 
        sp.*, 
        u.email, 
        d.dept_name
      FROM student_profiles sp
      JOIN users u ON sp.student_id = u.user_id
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

// GET /hod/faculty?dept=CSE
router.get("/faculty", async (req, res) => {
  const { dept } = req.query;
  logger.info(`Fetching faculty: dept=${dept}`);
  try {
    let query = `
      SELECT fp.*,
             fsa.year, fsa.section
      FROM faculty_profiles fp
      LEFT JOIN faculty_section_assignment fsa ON fp.faculty_id = fsa.faculty_id
      WHERE 1=1
    `;

    const params = [];

    if (dept) {
      query += " AND fp.dept_code = ?";
      params.push(dept);
    }

    const [rows] = await db.query(query, params);

    // Aggregate assignments by faculty_id
    const facultyMap = new Map();
    rows.forEach((row) => {
      if (!facultyMap.has(row.faculty_id)) {
        facultyMap.set(row.faculty_id, {
          faculty_id: row.faculty_id,
          name: row.name,
          dept_code: row.dept_code,
          assignments: [],
        });
      }
      if (row.year && row.section) {
        facultyMap.get(row.faculty_id).assignments.push({
          year: row.year,
          section: row.section,
        });
      }
    });

    const faculty = Array.from(facultyMap.values());
    logger.info(`Fetched ${faculty.length} faculty with assignments`);
    res.json(faculty);
  } catch (err) {
    logger.error(`Error fetching faculty: ${err.message}`);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /hod/assign-faculty
router.post("/assign-faculty", async (req, res) => {
  const { faculty_id, dept_code, assignments } = req.body;
  logger.info(
    `Assign faculty: faculty_id=${faculty_id}, dept_code=${dept_code}, assignments=${JSON.stringify(
      assignments
    )}`
  );

  // Validate input
  if (
    !faculty_id ||
    !dept_code ||
    !assignments ||
    !Array.isArray(assignments)
  ) {
    logger.warn("Missing or invalid fields in assign-faculty");
    return res
      .status(400)
      .json({
        message: "Faculty ID, department, and assignments array are required",
      });
  }

  if (assignments.length === 0) {
    logger.warn("Empty assignments array");
    return res
      .status(400)
      .json({ message: "At least one assignment is required" });
  }

  // Validate each assignment
  for (const assignment of assignments) {
    if (!assignment.year || !assignment.section) {
      logger.warn("Invalid assignment object");
      return res
        .status(400)
        .json({ message: "Each assignment must have year and section" });
    }
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Delete existing assignments for this faculty
    await connection.query(
      "DELETE FROM faculty_section_assignment WHERE faculty_id = ?",
      [faculty_id]
    );

    // Insert new assignments
    for (const assignment of assignments) {
      await connection.query(
        "INSERT INTO faculty_section_assignment (faculty_id, year, section) VALUES (?, ?, ?)",
        [faculty_id, assignment.year, assignment.section]
      );
    }

    await connection.commit();
    logger.info(
      `Faculty assigned successfully: faculty_id=${faculty_id}, ${assignments.length} assignments`
    );
    res.json({
      message: "Faculty assigned successfully",
      assignmentCount: assignments.length,
    });
  } catch (err) {
    await connection.rollback();
    logger.error(`Error assigning faculty: ${err.message}`);
    res.status(500).json({ message: "Server error", error: err.message });
  } finally {
    connection.release();
  }
});

module.exports = router;
