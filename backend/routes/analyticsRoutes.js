const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { logger } = require("../utils");

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

module.exports = router;
