const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { logger } = require("../utils");
const { generateCodingPointsReport } = require("../utils/reportGenerator");

const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const parseJsonArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_err) {
    return [];
  }
};

// GET /api/reports/coding-points - Generate specialized report
router.get("/coding-points", async (req, res) => {
  const { dept, year, section, userId } = req.query;

  logger.info(
    `Generating Coding Points Report for Dept: ${dept}, Year: ${year}, Section: ${section}`
  );

  try {
    res.setTimeout(180000);

    // 1. Fetch Department naming
    let deptName = dept || "All Departments";
    if (dept) {
      const [deptRows] = await db.query(
        "SELECT dept_name FROM dept WHERE dept_code = ?",
        [dept]
      );
      deptName = deptRows[0]?.dept_name || dept;
    }

    // 2. Fetch Students matching the filters
    let query = `
      SELECT sp.*, u.email, d.dept_name
      FROM student_profiles sp
      JOIN users u ON sp.student_id = u.user_id
      JOIN dept d ON sp.dept_code = d.dept_code
      WHERE sp.status = 'active'
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

    query += " ORDER BY sp.student_id ASC";
    const [students] = await db.query(query, params);

    const studentIds = students.map((student) => student.student_id);

    const performanceByStudentId = new Map();
    const codingProfileByStudentId = new Map();

    if (studentIds.length > 0) {
      const [perfRows] = await db.query(
        `SELECT * FROM student_performance WHERE student_id IN (?)`,
        [studentIds]
      );
      const [codingProfiles] = await db.query(
        `SELECT student_id, leetcode_status, codechef_status, geeksforgeeks_status, hackerrank_status, github_status
         FROM student_coding_profiles
         WHERE student_id IN (?)`,
        [studentIds]
      );

      for (const row of perfRows) {
        performanceByStudentId.set(row.student_id, row);
      }
      for (const row of codingProfiles) {
        codingProfileByStudentId.set(row.student_id, row);
      }
    }

    // 3. Attach performance for each student
    for (const student of students) {
      const p = performanceByStudentId.get(student.student_id);
      const cp = codingProfileByStudentId.get(student.student_id) || {};

      if (p) {

        const isLeetcodeAccepted = cp.leetcode_status === "accepted";
        const isCodechefAccepted = cp.codechef_status === "accepted";
        const isGfgAccepted = cp.geeksforgeeks_status === "accepted";
        const isHackerrankAccepted = cp.hackerrank_status === "accepted";
        const isGithubAccepted = cp.github_status === "accepted";

        const hackerrankBadgesList = isHackerrankAccepted
          ? parseJsonArray(p.badgesList_hr)
          : [];

        const combined = {
          totalSolved:
            (isLeetcodeAccepted
              ? toNumber(p.easy_lc) + toNumber(p.medium_lc) + toNumber(p.hard_lc)
              : 0) +
            (isGfgAccepted
              ? toNumber(p.school_gfg) +
                toNumber(p.basic_gfg) +
                toNumber(p.easy_gfg) +
                toNumber(p.medium_gfg) +
                toNumber(p.hard_gfg)
              : 0) +
            (isCodechefAccepted ? toNumber(p.problems_cc) : 0),
          totalContests:
            (isLeetcodeAccepted ? toNumber(p.contests_lc) : 0) +
            (isCodechefAccepted ? toNumber(p.contests_cc) : 0) +
            (isGfgAccepted ? toNumber(p.contests_gfg) : 0),
        };

        const platformWise = {
          leetcode: {
            easy: isLeetcodeAccepted ? toNumber(p.easy_lc) : 0,
            medium: isLeetcodeAccepted ? toNumber(p.medium_lc) : 0,
            hard: isLeetcodeAccepted ? toNumber(p.hard_lc) : 0,
            contests: isLeetcodeAccepted ? toNumber(p.contests_lc) : 0,
            rating: isLeetcodeAccepted ? toNumber(p.rating_lc) : 0,
            badges: isLeetcodeAccepted ? toNumber(p.badges_lc) : 0,
          },
          gfg: {
            school: isGfgAccepted ? toNumber(p.school_gfg) : 0,
            basic: isGfgAccepted ? toNumber(p.basic_gfg) : 0,
            easy: isGfgAccepted ? toNumber(p.easy_gfg) : 0,
            medium: isGfgAccepted ? toNumber(p.medium_gfg) : 0,
            hard: isGfgAccepted ? toNumber(p.hard_gfg) : 0,
            contests: isGfgAccepted ? toNumber(p.contests_gfg) : 0,
          },
          codechef: {
            problems: isCodechefAccepted ? toNumber(p.problems_cc) : 0,
            contests: isCodechefAccepted ? toNumber(p.contests_cc) : 0,
            rating: isCodechefAccepted ? toNumber(p.rating_cc) : 0,
            stars: isCodechefAccepted ? toNumber(p.stars_cc) : 0,
            badges: isCodechefAccepted ? toNumber(p.badges_cc) : 0,
          },
          hackerrank: {
            badges: isHackerrankAccepted
              ? toNumber(p.badges_hr) || hackerrankBadgesList.length
              : 0,
            totalStars: isHackerrankAccepted ? toNumber(p.stars_hr) : 0,
            badgesList: isHackerrankAccepted
              ? hackerrankBadgesList
              : [],
          },
          github: {
            repos: isGithubAccepted ? toNumber(p.repos_gh) : 0,
            contributions: isGithubAccepted ? toNumber(p.contributions_gh) : 0,
          },
        };

        student.performance = { combined, platformWise };
      } else {
        student.performance = {
          combined: { totalSolved: 0, totalContests: 0 },
          platformWise: {
            leetcode: { easy: 0, medium: 0, hard: 0, contests: 0, rating: 0, badges: 0 },
            gfg: { school: 0, basic: 0, easy: 0, medium: 0, hard: 0, contests: 0 },
            codechef: { problems: 0, contests: 0, rating: 0, stars: 0, badges: 0 },
            hackerrank: { badges: 0, totalStars: 0, badgesList: [] },
            github: { repos: 0, contributions: 0 },
          },
        };
      }
    }

    // 4. Generate Report
    const buffer = await generateCodingPointsReport(students, {
      deptName,
      year,
      section,
      date: new Date().toLocaleDateString("en-GB"),
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    const safeDept = dept || "all";
    const safeYear = year || "all";
    const safeSection = section || "all";
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="Coding_Points_${safeDept}_${safeYear}_${safeSection}.xlsx"`
    );
    res.setHeader("Cache-Control", "no-store");

    res.send(buffer);
  } catch (err) {
    logger.error(`Error generating report for userId ${userId}: ${err.message}`);
    res.status(500).json({ message: "Server error generating report" });
  }
});

module.exports = router;
