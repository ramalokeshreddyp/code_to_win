const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { logger } = require("../utils");

const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const safeJsonArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (_err) {
    return [];
  }
};

const normalizeFilter = (value) => {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  if (!text || text.toLowerCase() === "all") return null;
  return text;
};

const getSectionVariants = (sectionValue) => {
  const text = normalizeFilter(sectionValue);
  if (!text) return [];

  const variants = new Set([text]);
  const upper = text.toUpperCase();

  if (/^[A-Z]$/.test(upper)) {
    variants.add(String(upper.charCodeAt(0) - 64));
  }

  if (/^\d+$/.test(text)) {
    const index = Number(text);
    if (index >= 1 && index <= 26) {
      variants.add(String.fromCharCode(64 + index));
    }
  }

  return Array.from(variants);
};

const normalizeBadgeCategory = (badgeName) => {
  const raw = String(badgeName || "").trim();
  if (!raw) return "Other";

  const compact = raw.replace(/\s+/g, " ").toLowerCase();

  const aliases = {
    c: "C",
    "c language": "C",
    cpp: "C++",
    "c++": "C++",
    java: "Java",
    python: "Python",
    sql: "SQL",
    "problem solving": "Problem Solving",
    "problem-solving": "Problem Solving",
    "10 days of javascript": "Days of JS",
    "30 days of code": "Days of Code",
    "days of javascript": "Days of JS",
    "days of js": "Days of JS",
    "days of code": "Days of Code",
  };

  if (aliases[compact]) return aliases[compact];

  if (compact.includes("problem") && compact.includes("solv")) {
    return "Problem Solving";
  }
  if (compact.includes("days") && compact.includes("javascript")) {
    return "Days of JS";
  }
  if (compact.includes("days") && compact.includes("code")) {
    return "Days of Code";
  }

  return raw;
};

// GET /analytics/realtime-kpi - Real-time Key Performance Indicators
router.get("/realtime-kpi", async (req, res) => {
  try {
    const [stats] = await db.query(`
      SELECT 
        (SELECT COUNT(DISTINCT ip_address) FROM visitor_sessions) as total_visitors,
        (SELECT COUNT(*) FROM student_profiles WHERE score > 0) as active_students,
        (SELECT COUNT(*) FROM student_profiles) as total_students,
        (SELECT COUNT(*) FROM faculty_profiles) as active_faculty,
        (SELECT COUNT(*) FROM hod_profiles) as active_hods
    `);

    // Department Distribution
    const [deptDist] = await db.query(`
      SELECT d.dept_name, COUNT(sp.student_id) as value
      FROM dept d
      LEFT JOIN student_profiles sp ON d.dept_code = sp.dept_code
      GROUP BY d.dept_code, d.dept_name
      ORDER BY value DESC
    `);

    res.json({
      metrics: stats[0],
      departmentDistribution: deptDist,
    });
  } catch (err) {
    logger.error(`Error fetching real-time KPI: ${err.message}`);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /analytics/performance-graph - Filtered Performance Data
router.get("/performance-graph", async (req, res) => {
  const { dept, year, section } = req.query;

  try {
    let query = `
      SELECT sp.name, sp.score, sp.overall_rank, d.dept_name as department,
        p.easy_lc + p.medium_lc + p.hard_lc + 
        p.school_gfg + p.basic_gfg + p.easy_gfg + p.medium_gfg + p.hard_gfg +
        p.problems_cc as totalSolved,
        p.contests_lc + p.contests_gfg + p.contests_cc as contests,
        p.last_updated
      FROM student_profiles sp
      JOIN dept d ON sp.dept_code = d.dept_code
      LEFT JOIN student_performance p ON sp.student_id = p.student_id
      WHERE sp.score > 0
    `;

    const params = [];

    if (dept && dept !== "all") {
      query += ` AND sp.dept_code = ?`;
      params.push(dept);
    }

    if (year && year !== "all") {
      query += ` AND sp.year = ?`;
      params.push(year);
    }

    if (section && section !== "all") {
      query += ` AND sp.section = ?`;
      params.push(section);
    }

    query += ` ORDER BY sp.score DESC LIMIT 50`;

    const [data] = await db.query(query, params);

    res.json(data);
  } catch (err) {
    logger.error(`Error fetching performance graph: ${err.message}`);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /analytics/system-health - Real-time System Health
router.get("/system-health", async (req, res) => {
  try {
    const startTime = Date.now();

    // Check DB Connection
    await db.query("SELECT 1");
    const dbLatency = Date.now() - startTime;

    // Get Active DB Connections
    const [threads] = await db.query("SHOW STATUS LIKE 'Threads_connected'");
    const activeConnections = parseInt(threads[0].Value);

    // Get Memory Usage (Node Process)
    const memory = process.memoryUsage();

    res.json({
      systemStatus: "healthy",
      uptime: process.uptime(), // seconds
      responseTime: dbLatency,
      activeConnections,
      databaseStatus: "connected",
      memoryUsage: Math.round(memory.heapUsed / 1024 / 1024), // MB
      cpuUsage: 0, // Placeholder as Node.js doesn't provide direct CPU % easily
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.json({
      systemStatus: "error",
      databaseStatus: "disconnected",
      error: err.message,
    });
  }
});

// GET /analytics/platform-statistics - aggregated platform stats with filters
router.get("/platform-statistics", async (req, res) => {
  const dept = normalizeFilter(req.query.dept);
  const year = normalizeFilter(req.query.year);
  const section = normalizeFilter(req.query.section);
  const sectionVariants = getSectionVariants(section);
  const degree = normalizeFilter(req.query.degree);

  try {
    const where = ["sp.status = 'active'"];
    const params = [];

    if (dept) {
      where.push("sp.dept_code = ?");
      params.push(dept);
    }
    if (year) {
      where.push("sp.year = ?");
      params.push(year);
    }
    if (sectionVariants.length > 0) {
      const placeholders = sectionVariants.map(() => "?").join(", ");
      where.push(`sp.section IN (${placeholders})`);
      params.push(...sectionVariants);
    }
    if (degree) {
      where.push("sp.degree = ?");
      params.push(degree);
    }

    const whereClause = where.join(" AND ");

    const [overviewRows] = await db.query(
      `SELECT
        COUNT(*) AS total_students,
        SUM(CASE WHEN cp.leetcode_status = 'accepted' THEN 1 ELSE 0 END) AS active_leetcode_students,
        SUM(CASE WHEN cp.geeksforgeeks_status = 'accepted' THEN 1 ELSE 0 END) AS active_gfg_students,
        SUM(CASE WHEN cp.codechef_status = 'accepted' THEN 1 ELSE 0 END) AS active_codechef_students,
        SUM(CASE WHEN cp.hackerrank_status = 'accepted' THEN 1 ELSE 0 END) AS active_hackerrank_students,
        SUM(CASE WHEN cp.github_status = 'accepted' THEN 1 ELSE 0 END) AS active_github_students,
        SUM(CASE WHEN cp.leetcode_status = 'accepted' THEN COALESCE(p.contests_lc, 0) ELSE 0 END) AS lc_total_contests,
        SUM(CASE WHEN cp.leetcode_status = 'accepted' THEN COALESCE(p.easy_lc, 0) ELSE 0 END) AS lc_easy,
        SUM(CASE WHEN cp.leetcode_status = 'accepted' THEN COALESCE(p.medium_lc, 0) ELSE 0 END) AS lc_medium,
        SUM(CASE WHEN cp.leetcode_status = 'accepted' THEN COALESCE(p.hard_lc, 0) ELSE 0 END) AS lc_hard,
        SUM(CASE WHEN cp.geeksforgeeks_status = 'accepted' THEN COALESCE(p.contests_gfg, 0) ELSE 0 END) AS gfg_total_contests,
        SUM(CASE WHEN cp.geeksforgeeks_status = 'accepted' THEN COALESCE(p.school_gfg, 0) ELSE 0 END) AS gfg_school,
        SUM(CASE WHEN cp.geeksforgeeks_status = 'accepted' THEN COALESCE(p.basic_gfg, 0) ELSE 0 END) AS gfg_basic,
        SUM(CASE WHEN cp.geeksforgeeks_status = 'accepted' THEN COALESCE(p.easy_gfg, 0) ELSE 0 END) AS gfg_easy,
        SUM(CASE WHEN cp.geeksforgeeks_status = 'accepted' THEN COALESCE(p.medium_gfg, 0) ELSE 0 END) AS gfg_medium,
        SUM(CASE WHEN cp.geeksforgeeks_status = 'accepted' THEN COALESCE(p.hard_gfg, 0) ELSE 0 END) AS gfg_hard,
        SUM(CASE WHEN cp.codechef_status = 'accepted' THEN COALESCE(p.contests_cc, 0) ELSE 0 END) AS cc_total_contests,
        SUM(CASE WHEN cp.codechef_status = 'accepted' THEN COALESCE(p.problems_cc, 0) ELSE 0 END) AS cc_total_problems,
        SUM(CASE WHEN cp.hackerrank_status = 'accepted' THEN COALESCE(p.badges_hr, 0) ELSE 0 END) AS hr_total_badges,
        SUM(CASE WHEN cp.github_status = 'accepted' THEN COALESCE(p.repos_gh, 0) ELSE 0 END) AS gh_total_repos,
        SUM(CASE WHEN cp.github_status = 'accepted' THEN COALESCE(p.contributions_gh, 0) ELSE 0 END) AS gh_total_contributions
      FROM student_profiles sp
      LEFT JOIN student_performance p ON p.student_id = sp.student_id
      LEFT JOIN student_coding_profiles cp ON cp.student_id = sp.student_id
      WHERE ${whereClause}`,
      params
    );

    const [deptTopRows] = await db.query(
      `SELECT d.dept_name, COUNT(*) AS student_count
       FROM student_profiles sp
       JOIN dept d ON d.dept_code = sp.dept_code
       WHERE ${whereClause}
       GROUP BY d.dept_name
       ORDER BY student_count DESC
       LIMIT 5`,
      params
    );

    const [degreeRows] = await db.query(
      `SELECT DISTINCT sp.degree
       FROM student_profiles sp
       WHERE ${whereClause}
         AND sp.degree IS NOT NULL
         AND TRIM(sp.degree) <> ''
       ORDER BY sp.degree ASC`,
      params
    );

    const [badgeRows] = await db.query(
      `SELECT sp.student_id, p.badgesList_hr
       FROM student_profiles sp
       LEFT JOIN student_performance p ON p.student_id = sp.student_id
       LEFT JOIN student_coding_profiles cp ON cp.student_id = sp.student_id
       WHERE ${whereClause}
         AND cp.hackerrank_status = 'accepted'`
      ,
      params
    );

    const badgeStudentSets = new Map();
    for (const row of badgeRows) {
      const badges = safeJsonArray(row.badgesList_hr);
      const seenInStudent = new Set();
      for (const badge of badges) {
        const name = normalizeBadgeCategory(badge?.name || "Other");
        if (seenInStudent.has(name)) continue;
        seenInStudent.add(name);

        if (!badgeStudentSets.has(name)) {
          badgeStudentSets.set(name, new Set());
        }
        badgeStudentSets.get(name).add(row.student_id);
      }
    }

    const badgeDistribution = Array.from(badgeStudentSets.entries())
      .map(([badge, studentSet]) => ({
        badge,
        students: studentSet.size,
      }))
      .sort((a, b) => b.students - a.students);

    const overview = overviewRows[0] || {};

    const lcTotalProblems =
      toNumber(overview.lc_easy) +
      toNumber(overview.lc_medium) +
      toNumber(overview.lc_hard);
    const gfgTotalProblems =
      toNumber(overview.gfg_school) +
      toNumber(overview.gfg_basic) +
      toNumber(overview.gfg_easy) +
      toNumber(overview.gfg_medium) +
      toNumber(overview.gfg_hard);

    const studentCount = toNumber(overview.total_students);

    res.json({
      filters: {
        dept: dept || "all",
        year: year || "all",
        section: section || "all",
        degree: degree || "all",
      },
      options: {
        degrees: degreeRows
          .map((row) => row.degree)
          .filter(Boolean),
      },
      overview: {
        totalStudents: studentCount,
        activeLeetCodeStudents: toNumber(overview.active_leetcode_students),
        activeGFGStudents: toNumber(overview.active_gfg_students),
        activeCodeChefStudents: toNumber(overview.active_codechef_students),
        activeHackerRankStudents: toNumber(overview.active_hackerrank_students),
        activeGitHubStudents: toNumber(overview.active_github_students),
      },
      leetcode: {
        totalContestsAttended: toNumber(overview.lc_total_contests),
        totalProblemsSolved: lcTotalProblems,
        totalEasyProblems: toNumber(overview.lc_easy),
        totalMediumProblems: toNumber(overview.lc_medium),
        totalHardProblems: toNumber(overview.lc_hard),
        averageProblemsPerStudent:
          studentCount > 0
            ? Number((lcTotalProblems / studentCount).toFixed(2))
            : 0,
      },
      gfg: {
        totalContests: toNumber(overview.gfg_total_contests),
        totalProblemsSolved: gfgTotalProblems,
        totalSchool: toNumber(overview.gfg_school),
        totalBasic: toNumber(overview.gfg_basic),
        totalEasy: toNumber(overview.gfg_easy),
        totalMedium: toNumber(overview.gfg_medium),
        totalHard: toNumber(overview.gfg_hard),
      },
      codechef: {
        totalContestsWritten: toNumber(overview.cc_total_contests),
        totalProblemsSolved: toNumber(overview.cc_total_problems),
      },
      hackerrank: {
        totalBadges: toNumber(overview.hr_total_badges),
        badgeDistribution,
      },
      github: {
        totalPublicRepositories: toNumber(overview.gh_total_repos),
        totalContributions: toNumber(overview.gh_total_contributions),
        totalActiveStudents: toNumber(overview.active_github_students),
      },
      topDepartments: deptTopRows,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    logger.error(`Error fetching platform statistics: ${err.message}`);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
