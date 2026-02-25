const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { logger } = require("../utils");
const NodeCache = require("node-cache");

const weeklyProgressCache = new NodeCache({ stdTTL: 300, useClones: false });

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

const formatDateOnly = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getWeekRangeMondaySunday = (date = new Date()) => {
  const base = new Date(date);
  base.setHours(0, 0, 0, 0);

  const day = base.getDay();
  const mondayDelta = day === 0 ? -6 : 1 - day;

  const weekStart = new Date(base);
  weekStart.setDate(base.getDate() + mondayDelta);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  return {
    start: weekStart,
    end: weekEnd,
  };
};

const getPreviousWeekRange = (currentWeekStart) => {
  const prevStart = new Date(currentWeekStart);
  prevStart.setDate(currentWeekStart.getDate() - 7);
  const prevEnd = new Date(prevStart);
  prevEnd.setDate(prevStart.getDate() + 6);

  return {
    start: prevStart,
    end: prevEnd,
  };
};

const buildSnapshotFilterSql = ({ dept, year, sectionVariants, degree }) => {
  const where = [];
  const params = [];

  if (dept) {
    where.push("snap.dept_code = ?");
    params.push(dept);
  }
  if (year) {
    where.push("snap.year = ?");
    params.push(year);
  }
  if (sectionVariants.length > 0) {
    const placeholders = sectionVariants.map(() => "?").join(", ");
    where.push(`snap.section IN (${placeholders})`);
    params.push(...sectionVariants);
  }
  if (degree) {
    where.push("snap.degree = ?");
    params.push(degree);
  }

  return {
    whereClause: where.length > 0 ? ` AND ${where.join(" AND ")}` : "",
    params,
  };
};

const ensureWeeklySnapshotTable = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS weekly_performance_snapshots (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      week_start DATE NOT NULL,
      week_end DATE NOT NULL,
      snapshot_date DATE NOT NULL,
      student_id VARCHAR(50) NOT NULL,
      dept_code VARCHAR(20) DEFAULT NULL,
      year VARCHAR(10) DEFAULT NULL,
      section VARCHAR(10) DEFAULT NULL,
      degree VARCHAR(50) DEFAULT NULL,
      leetcode_total_problems INT NOT NULL DEFAULT 0,
      leetcode_contests INT NOT NULL DEFAULT 0,
      gfg_total_problems INT NOT NULL DEFAULT 0,
      gfg_contests INT NOT NULL DEFAULT 0,
      codechef_total_problems INT NOT NULL DEFAULT 0,
      codechef_contests INT NOT NULL DEFAULT 0,
      hackerrank_total_badges INT NOT NULL DEFAULT 0,
      total_problems INT NOT NULL DEFAULT 0,
      total_contests INT NOT NULL DEFAULT 0,
      active_leetcode TINYINT(1) NOT NULL DEFAULT 0,
      active_gfg TINYINT(1) NOT NULL DEFAULT 0,
      active_codechef TINYINT(1) NOT NULL DEFAULT 0,
      active_hackerrank TINYINT(1) NOT NULL DEFAULT 0,
      captured_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uniq_week_student (week_start, student_id),
      INDEX idx_week_filters (week_start, dept_code, year, section, degree)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
};

const captureWeeklySnapshot = async ({ weekStart, weekEnd }) => {
  const weekStartStr = formatDateOnly(weekStart);
  const weekEndStr = formatDateOnly(weekEnd);

  await db.query(
    `
      INSERT INTO weekly_performance_snapshots (
        week_start,
        week_end,
        snapshot_date,
        student_id,
        dept_code,
        year,
        section,
        degree,
        leetcode_total_problems,
        leetcode_contests,
        gfg_total_problems,
        gfg_contests,
        codechef_total_problems,
        codechef_contests,
        hackerrank_total_badges,
        total_problems,
        total_contests,
        active_leetcode,
        active_gfg,
        active_codechef,
        active_hackerrank,
        captured_at
      )
      SELECT
        ?,
        ?,
        CURDATE(),
        sp.student_id,
        sp.dept_code,
        CAST(sp.year AS CHAR),
        CAST(sp.section AS CHAR),
        sp.degree,
        CASE WHEN cp.leetcode_status = 'accepted'
          THEN COALESCE(p.easy_lc, 0) + COALESCE(p.medium_lc, 0) + COALESCE(p.hard_lc, 0)
          ELSE 0 END AS leetcode_total_problems,
        CASE WHEN cp.leetcode_status = 'accepted' THEN COALESCE(p.contests_lc, 0) ELSE 0 END AS leetcode_contests,
        CASE WHEN cp.geeksforgeeks_status = 'accepted'
          THEN COALESCE(p.school_gfg, 0) + COALESCE(p.basic_gfg, 0) + COALESCE(p.easy_gfg, 0) + COALESCE(p.medium_gfg, 0) + COALESCE(p.hard_gfg, 0)
          ELSE 0 END AS gfg_total_problems,
        CASE WHEN cp.geeksforgeeks_status = 'accepted' THEN COALESCE(p.contests_gfg, 0) ELSE 0 END AS gfg_contests,
        CASE WHEN cp.codechef_status = 'accepted' THEN COALESCE(p.problems_cc, 0) ELSE 0 END AS codechef_total_problems,
        CASE WHEN cp.codechef_status = 'accepted' THEN COALESCE(p.contests_cc, 0) ELSE 0 END AS codechef_contests,
        CASE WHEN cp.hackerrank_status = 'accepted' THEN COALESCE(p.badges_hr, 0) ELSE 0 END AS hackerrank_total_badges,
        (
          CASE WHEN cp.leetcode_status = 'accepted'
            THEN COALESCE(p.easy_lc, 0) + COALESCE(p.medium_lc, 0) + COALESCE(p.hard_lc, 0)
            ELSE 0 END
          +
          CASE WHEN cp.geeksforgeeks_status = 'accepted'
            THEN COALESCE(p.school_gfg, 0) + COALESCE(p.basic_gfg, 0) + COALESCE(p.easy_gfg, 0) + COALESCE(p.medium_gfg, 0) + COALESCE(p.hard_gfg, 0)
            ELSE 0 END
          +
          CASE WHEN cp.codechef_status = 'accepted' THEN COALESCE(p.problems_cc, 0) ELSE 0 END
        ) AS total_problems,
        (
          CASE WHEN cp.leetcode_status = 'accepted' THEN COALESCE(p.contests_lc, 0) ELSE 0 END
          +
          CASE WHEN cp.geeksforgeeks_status = 'accepted' THEN COALESCE(p.contests_gfg, 0) ELSE 0 END
          +
          CASE WHEN cp.codechef_status = 'accepted' THEN COALESCE(p.contests_cc, 0) ELSE 0 END
        ) AS total_contests,
        CASE WHEN cp.leetcode_status = 'accepted' THEN 1 ELSE 0 END AS active_leetcode,
        CASE WHEN cp.geeksforgeeks_status = 'accepted' THEN 1 ELSE 0 END AS active_gfg,
        CASE WHEN cp.codechef_status = 'accepted' THEN 1 ELSE 0 END AS active_codechef,
        CASE WHEN cp.hackerrank_status = 'accepted' THEN 1 ELSE 0 END AS active_hackerrank,
        NOW()
      FROM student_profiles sp
      LEFT JOIN student_performance p ON p.student_id = sp.student_id
      LEFT JOIN student_coding_profiles cp ON cp.student_id = sp.student_id
      WHERE sp.status = 'active'
      ON DUPLICATE KEY UPDATE
        week_end = VALUES(week_end),
        snapshot_date = VALUES(snapshot_date),
        dept_code = VALUES(dept_code),
        year = VALUES(year),
        section = VALUES(section),
        degree = VALUES(degree),
        leetcode_total_problems = VALUES(leetcode_total_problems),
        leetcode_contests = VALUES(leetcode_contests),
        gfg_total_problems = VALUES(gfg_total_problems),
        gfg_contests = VALUES(gfg_contests),
        codechef_total_problems = VALUES(codechef_total_problems),
        codechef_contests = VALUES(codechef_contests),
        hackerrank_total_badges = VALUES(hackerrank_total_badges),
        total_problems = VALUES(total_problems),
        total_contests = VALUES(total_contests),
        active_leetcode = VALUES(active_leetcode),
        active_gfg = VALUES(active_gfg),
        active_codechef = VALUES(active_codechef),
        active_hackerrank = VALUES(active_hackerrank),
        captured_at = NOW()
    `,
    [weekStartStr, weekEndStr]
  );
};

const sumRows = (rows, selector) =>
  rows.reduce((total, row) => total + toNumber(selector(row)), 0);

// GET /analytics/realtime-kpi - Real-time Key Performance Indicators
router.get("/realtime-kpi", async (req, res) => {
  try {
    const [stats] = await db.query(`
      SELECT 
        (SELECT COALESCE(SUM(vs.unique_visitors), 0) FROM visitor_stats vs) as total_visitors,
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

// GET /analytics/weekly-progress - weekly comparison using stored snapshots
router.get("/weekly-progress", async (req, res) => {
  const dept = normalizeFilter(req.query.dept);
  const year = normalizeFilter(req.query.year);
  const section = normalizeFilter(req.query.section);
  const sectionVariants = getSectionVariants(section);
  const degree = normalizeFilter(req.query.degree);
  const shouldRefresh = String(req.query.refresh || "").toLowerCase() === "true";

  const currentWeek = getWeekRangeMondaySunday(new Date());
  const previousWeek = getPreviousWeekRange(currentWeek.start);
  const currentWeekStart = formatDateOnly(currentWeek.start);
  const currentWeekEnd = formatDateOnly(currentWeek.end);
  const previousWeekStart = formatDateOnly(previousWeek.start);
  const previousWeekEnd = formatDateOnly(previousWeek.end);

  const cacheKey = [
    "weekly-progress",
    currentWeekStart,
    dept || "all",
    year || "all",
    section || "all",
    degree || "all",
  ].join("::");

  if (shouldRefresh) {
    weeklyProgressCache.flushAll();
  } else {
    const cached = weeklyProgressCache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }
  }

  try {
    await ensureWeeklySnapshotTable();

    const [[currentSnapshotCount]] = await db.query(
      `SELECT COUNT(*) AS count
       FROM weekly_performance_snapshots
       WHERE week_start = ?`,
      [currentWeekStart]
    );

    if (shouldRefresh || toNumber(currentSnapshotCount?.count) === 0) {
      await captureWeeklySnapshot({ weekStart: currentWeek.start, weekEnd: currentWeek.end });
    }

    const filterSql = buildSnapshotFilterSql({ dept, year, sectionVariants, degree });

    const [currentRows] = await db.query(
      `SELECT snap.*
       FROM weekly_performance_snapshots snap
       WHERE snap.week_start = ?${filterSql.whereClause}`,
      [currentWeekStart, ...filterSql.params]
    );

    const [previousRows] = await db.query(
      `SELECT snap.*
       FROM weekly_performance_snapshots snap
       WHERE snap.week_start = ?${filterSql.whereClause}`,
      [previousWeekStart, ...filterSql.params]
    );

    const previousByStudent = new Map(
      previousRows.map((row) => [row.student_id, row])
    );

    const studentActivity = currentRows.map((current) => {
      const previous = previousByStudent.get(current.student_id) || {};

      const totalProblemsDelta = toNumber(current.total_problems) - toNumber(previous.total_problems);
      const leetcodeDelta =
        toNumber(current.leetcode_total_problems) - toNumber(previous.leetcode_total_problems);
      const gfgDelta = toNumber(current.gfg_total_problems) - toNumber(previous.gfg_total_problems);
      const codechefDelta =
        toNumber(current.codechef_total_problems) - toNumber(previous.codechef_total_problems);
      const hackerrankDelta =
        toNumber(current.hackerrank_total_badges) - toNumber(previous.hackerrank_total_badges);
      const contestsDelta = toNumber(current.total_contests) - toNumber(previous.total_contests);

      return {
        studentId: current.student_id,
        deptCode: current.dept_code,
        year: current.year,
        section: current.section,
        degree: current.degree,
        currentTotalProblems: toNumber(current.total_problems),
        previousTotalProblems: toNumber(previous.total_problems),
        totalProblemsDelta,
        leetcodeDelta,
        gfgDelta,
        codechefDelta,
        hackerrankDelta,
        contestsDelta,
      };
    });

    const studentsImproved = studentActivity.filter((row) => row.totalProblemsDelta > 0).length;
    const studentsDeclined = studentActivity.filter((row) => row.totalProblemsDelta < 0).length;
    const studentsUnchanged = studentActivity.filter((row) => row.totalProblemsDelta === 0).length;

    const activeThisWeek = studentActivity.filter(
      (row) =>
        row.totalProblemsDelta !== 0 ||
        row.hackerrankDelta !== 0 ||
        row.contestsDelta !== 0
    ).length;

    const totalProblemsAddedThisWeek = studentActivity.reduce(
      (total, row) => total + Math.max(0, row.totalProblemsDelta),
      0
    );

    const totalContestsAddedThisWeek = studentActivity.reduce(
      (total, row) => total + Math.max(0, row.contestsDelta),
      0
    );

    const platformComparison = [
      {
        platform: "LeetCode",
        lastWeek: sumRows(previousRows, (row) => row.leetcode_total_problems),
        thisWeek: sumRows(currentRows, (row) => row.leetcode_total_problems),
      },
      {
        platform: "GeeksforGeeks",
        lastWeek: sumRows(previousRows, (row) => row.gfg_total_problems),
        thisWeek: sumRows(currentRows, (row) => row.gfg_total_problems),
      },
      {
        platform: "CodeChef",
        lastWeek: sumRows(previousRows, (row) => row.codechef_total_problems),
        thisWeek: sumRows(currentRows, (row) => row.codechef_total_problems),
      },
      {
        platform: "HackerRank Badges",
        lastWeek: sumRows(previousRows, (row) => row.hackerrank_total_badges),
        thisWeek: sumRows(currentRows, (row) => row.hackerrank_total_badges),
      },
    ].map((item) => ({
      ...item,
      growth: item.thisWeek - item.lastWeek,
    }));

    const platformContestComparison = [
      {
        platform: "LeetCode",
        lastWeek: sumRows(previousRows, (row) => row.leetcode_contests),
        thisWeek: sumRows(currentRows, (row) => row.leetcode_contests),
      },
      {
        platform: "GeeksforGeeks",
        lastWeek: sumRows(previousRows, (row) => row.gfg_contests),
        thisWeek: sumRows(currentRows, (row) => row.gfg_contests),
      },
      {
        platform: "CodeChef",
        lastWeek: sumRows(previousRows, (row) => row.codechef_contests),
        thisWeek: sumRows(currentRows, (row) => row.codechef_contests),
      },
    ].map((item) => ({
      ...item,
      growth: item.thisWeek - item.lastWeek,
    }));

    const topPerformers = studentActivity
      .map((row) => ({
        studentId: row.studentId,
        deptCode: row.deptCode,
        year: row.year,
        section: row.section,
        degree: row.degree,
        problemsDelta: row.totalProblemsDelta,
        contestsDelta: row.contestsDelta,
        hackerrankDelta: row.hackerrankDelta,
        activityIncrease:
          Math.max(0, row.totalProblemsDelta) +
          Math.max(0, row.contestsDelta) +
          Math.max(0, row.hackerrankDelta),
      }))
      .filter((row) => row.activityIncrease > 0)
      .sort((a, b) => b.activityIncrease - a.activityIncrease)
      .slice(0, 10);

    const response = {
      filters: {
        dept: dept || "all",
        year: year || "all",
        section: section || "all",
        degree: degree || "all",
      },
      options: {
        degrees: Array.from(
          new Set(
            currentRows
              .map((row) => String(row.degree || "").trim())
              .filter(Boolean)
          )
        ).sort((a, b) => a.localeCompare(b)),
      },
      weekRange: {
        thisWeekStart: currentWeekStart,
        thisWeekEnd: currentWeekEnd,
        lastWeekStart: previousWeekStart,
        lastWeekEnd: previousWeekEnd,
      },
      summary: {
        totalStudentsInScope: currentRows.length,
        totalStudentsActiveThisWeek: activeThisWeek,
        totalProblemsAddedThisWeek,
        totalContestsAddedThisWeek,
        studentsImproved,
        studentsDeclined,
        studentsUnchanged,
      },
      platformComparison,
      platformContestComparison,
      topPerformers,
      studentActivity: studentActivity
        .sort((a, b) => b.totalProblemsDelta - a.totalProblemsDelta)
        .slice(0, 500),
      generatedAt: new Date().toISOString(),
      snapshotMeta: {
        source: "weekly_performance_snapshots",
        refreshed: shouldRefresh,
      },
    };

    weeklyProgressCache.set(cacheKey, response);
    res.json(response);
  } catch (err) {
    logger.error(`Error fetching weekly progress: ${err.message}`);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
