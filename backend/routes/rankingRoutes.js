const express = require("express");
const router = express.Router();
const db = require("../config/db"); // MySQL connection
const { logger } = require("../utils"); // <-- Add logger

// Calculate score expression for ranking
async function getScoreExpression() {
  const [gradingData] = await db.query("SELECT * FROM grading_system");
  // Example: (p.badges_hr * 5) + (p.basic_gfg * 1) + ...
  return gradingData
    .map((row) => `(p.${row.metric} * ${row.points})`)
    .join(" + ");
}

// GET /ranking/overall
router.get("/overall", async (req, res) => {
  logger.info("Fetching overall ranking");
  try {
    const scoreExpr = await getScoreExpression();
    const limit = Math.max(1, Math.min(parseInt(req.query.limit) || 10000)); // max 1000
    const [rows] = await db.query(
      `SELECT 
  sp.student_id, 
  sp.*, 
  d.dept_name, 
  ${scoreExpr.replace(/p\.(\w+)/g, (match, metric) => {
    if (metric.includes("_lc"))
      return `CASE WHEN COALESCE(cp.leetcode_status, '') = 'accepted' THEN p.${metric} ELSE 0 END`;
    if (metric.includes("_cc"))
      return `CASE WHEN COALESCE(cp.codechef_status, '') = 'accepted' THEN p.${metric} ELSE 0 END`;
    if (metric.includes("_gfg"))
      return `CASE WHEN COALESCE(cp.geeksforgeeks_status, '') = 'accepted' THEN p.${metric} ELSE 0 END`;
    if (metric.includes("_hr"))
      return `CASE WHEN COALESCE(cp.hackerrank_status, '') = 'accepted' THEN p.${metric} ELSE 0 END`;
    return match;
  })} AS score
FROM student_profiles sp
JOIN student_performance p ON sp.student_id = p.student_id
LEFT JOIN student_coding_profiles cp ON sp.student_id = cp.student_id
JOIN dept d ON sp.dept_code = d.dept_code
ORDER BY score DESC, sp.student_id ASC
LIMIT ?`,
      [limit]
    );
    // Check if all scores are 0
    const allZero = rows.every((s) => s.score === 0);

    // If all scores are zero, sort by student_id (already handled by ORDER BY above)
    if (allZero) {
      rows.sort((a, b) => (a.student_id > b.student_id ? 1 : -1));
    }

    // Add rank field and update DB
    for (let i = 0; i < rows.length; i++) {
      rows[i].rank = i + 1;
      // Update the rank in the database
      await db.query(
        "UPDATE student_profiles SET score=?, overall_rank = ? WHERE student_id = ?",
        [rows[i].score, rows[i].rank, rows[i].student_id]
      );
    }

    // Fetch and attach performance data for each student
    for (const student of rows) {
      const [perfRows] = await db.query(
        `SELECT * FROM student_performance WHERE student_id = ?`,
        [student.student_id]
      );
      const [codingProfiles] = await db.query(
        `SELECT leetcode_status, codechef_status, geeksforgeeks_status, hackerrank_status FROM student_coding_profiles WHERE student_id = ?`,
        [student.student_id]
      );

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

        student.performance = {
          combined,
          platformWise,
        };
      }
    }

    logger.info(`Fetched overall ranking, count=${rows.length}`);
    res.json(rows);
  } catch (err) {
    logger.error(`Error fetching overall ranking: ${err.message}`);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /ranking/filter?department=CSE&section=A&year=3
router.get("/filter", async (req, res) => {
  const { dept, section, year } = req.query;
  logger.info(
    `Fetching filtered ranking: dept=${dept}, section=${section}, year=${year}`
  );
  try {
    const scoreExpr = await getScoreExpression();
    let where = "WHERE 1=1";
    const params = [];
    if (dept) {
      where += " AND sp.dept_code = ?";
      params.push(dept);
    }
    if (section) {
      where += " AND sp.section = ?";
      params.push(section);
    }
    if (year) {
      where += " AND sp.year = ?";
      params.push(year);
    }
    if (req.query.search) {
      where += " AND (sp.name LIKE ? OR sp.roll_number LIKE ?)";
      params.push(`%${req.query.search}%`, `%${req.query.search}%`);
    }
    const limit = Math.max(1, Math.min(parseInt(req.query.limit) || 100, 1000)); // max 1000
    const [rows] = await db.query(
      `SELECT 
  sp.*, 
  d.dept_name, 
  ${scoreExpr.replace(/p\.(\w+)/g, (match, metric) => {
    if (metric.includes("_lc"))
      return `CASE WHEN COALESCE(cp.leetcode_status, '') = 'accepted' THEN p.${metric} ELSE 0 END`;
    if (metric.includes("_cc"))
      return `CASE WHEN COALESCE(cp.codechef_status, '') = 'accepted' THEN p.${metric} ELSE 0 END`;
    if (metric.includes("_gfg"))
      return `CASE WHEN COALESCE(cp.geeksforgeeks_status, '') = 'accepted' THEN p.${metric} ELSE 0 END`;
    if (metric.includes("_hr"))
      return `CASE WHEN COALESCE(cp.hackerrank_status, '') = 'accepted' THEN p.${metric} ELSE 0 END`;
    return match;
  })} AS score
FROM student_profiles sp
JOIN student_performance p ON sp.student_id = p.student_id
LEFT JOIN student_coding_profiles cp ON sp.student_id = cp.student_id
JOIN dept d ON sp.dept_code = d.dept_code
${where}
ORDER BY score DESC, sp.student_id ASC
LIMIT ?`,
      [...params, limit]
    );

    // Check if all scores are 0
    const allZero = rows.every((s) => s.score === 0);
    if (allZero) {
      rows.sort((a, b) => (a.student_id > b.student_id ? 1 : -1));
    }

    rows.forEach((s, i) => (s.rank = i + 1));
    // Attach performance for each student
    for (const student of rows) {
      const [perfRows] = await db.query(
        `SELECT * FROM student_performance WHERE student_id = ?`,
        [student.student_id]
      );
      const [codingProfiles] = await db.query(
        `SELECT leetcode_status, codechef_status, geeksforgeeks_status, hackerrank_status FROM student_coding_profiles WHERE student_id = ?`,
        [student.student_id]
      );

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
    logger.info(`Fetched filtered ranking, count=${rows.length}`);
    res.json(rows);
  } catch (err) {
    logger.error(`Error fetching filtered ranking: ${err.message}`);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
