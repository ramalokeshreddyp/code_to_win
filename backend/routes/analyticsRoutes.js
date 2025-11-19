const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { logger } = require("../utils");

// GET /analytics/students - Student analytics
router.get("/students", async (req, res) => {
  logger.info("Fetching student analytics");
  try {
    // Total students by department
    const [deptStats] = await db.query(`
      SELECT d.dept_name, d.dept_code, COUNT(sp.student_id) as student_count
      FROM dept d
      LEFT JOIN student_profiles sp ON d.dept_code = sp.dept_code
      GROUP BY d.dept_code, d.dept_name
      ORDER BY student_count DESC
    `);

    // Students by year
    const [yearStats] = await db.query(`
      SELECT year, COUNT(*) as count
      FROM student_profiles
      GROUP BY year
      ORDER BY year
    `);

    // Active vs inactive students
    const [activityStats] = await db.query(`
      SELECT 
        COUNT(CASE WHEN sp.score > 0 THEN 1 END) as active_students,
        COUNT(CASE WHEN sp.score = 0 OR sp.score IS NULL THEN 1 END) as inactive_students,
        COUNT(*) as total_students
      FROM student_profiles sp
    `);

    // Recent registrations (last 30 days)
    const [recentRegistrations] = await db.query(`
      SELECT DATE(u.created_at) as date, COUNT(*) as registrations
      FROM users u
      JOIN student_profiles sp ON u.user_id = sp.student_id
      WHERE u.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(u.created_at)
      ORDER BY date DESC
    `);

    res.json({
      departmentStats: deptStats,
      yearStats,
      activityStats: activityStats[0],
      recentRegistrations
    });
  } catch (err) {
    logger.error(`Error fetching student analytics: ${err.message}`);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /analytics/performance - Performance analytics
router.get("/performance", async (req, res) => {
  logger.info("Fetching performance analytics");
  try {
    // Platform-wise performance
    const [platformStats] = await db.query(`
      SELECT 
        COUNT(CASE WHEN cp.leetcode_status = 'accepted' THEN 1 END) as leetcode_active,
        COUNT(CASE WHEN cp.codechef_status = 'accepted' THEN 1 END) as codechef_active,
        COUNT(CASE WHEN cp.geeksforgeeks_status = 'accepted' THEN 1 END) as gfg_active,
        COUNT(CASE WHEN cp.hackerrank_status = 'accepted' THEN 1 END) as hackerrank_active,
        COUNT(*) as total_students
      FROM student_coding_profiles cp
    `);

    // Score distribution
    const [scoreDistribution] = await db.query(`
      SELECT 
        CASE 
          WHEN score = 0 THEN '0'
          WHEN score BETWEEN 1 AND 50 THEN '1-50'
          WHEN score BETWEEN 51 AND 100 THEN '51-100'
          WHEN score BETWEEN 101 AND 200 THEN '101-200'
          WHEN score > 200 THEN '200+'
        END as score_range,
        COUNT(*) as count
      FROM student_profiles
      GROUP BY score_range
      ORDER BY 
        CASE score_range
          WHEN '0' THEN 1
          WHEN '1-50' THEN 2
          WHEN '51-100' THEN 3
          WHEN '101-200' THEN 4
          WHEN '200+' THEN 5
        END
    `);

    // Top performers by department
    const [topPerformers] = await db.query(`
      SELECT d.dept_name, sp.name, sp.score, sp.overall_rank
      FROM student_profiles sp
      JOIN dept d ON sp.dept_code = d.dept_code
      WHERE sp.score > 0
      ORDER BY sp.score DESC
      LIMIT 20
    `);

    // Performance trends (last updated times)
    const [updateTrends] = await db.query(`
      SELECT DATE(last_updated) as date, COUNT(*) as updates
      FROM student_performance
      WHERE last_updated >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(last_updated)
      ORDER BY date DESC
    `);

    res.json({
      platformStats: platformStats[0],
      scoreDistribution,
      topPerformers,
      updateTrends
    });
  } catch (err) {
    logger.error(`Error fetching performance analytics: ${err.message}`);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /analytics/visitors - Visitor analytics
router.get("/visitors", async (req, res) => {
  logger.info("Fetching visitor analytics");
  try {
    // Daily visitor stats for last 30 days
    const [dailyStats] = await db.query(`
      SELECT visit_date, visitor_count, unique_visitors
      FROM visitor_stats
      WHERE visit_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      ORDER BY visit_date DESC
    `);

    // Current active sessions
    const [activeSessions] = await db.query(`
      SELECT COUNT(*) as active_sessions
      FROM visitor_sessions
      WHERE is_active = 1 AND last_visit >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)
    `);

    // Peak hours analysis
    const [peakHours] = await db.query(`
      SELECT HOUR(last_visit) as hour, COUNT(*) as visits
      FROM visitor_sessions
      WHERE last_visit >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY HOUR(last_visit)
      ORDER BY hour
    `);

    // Browser/device stats
    const [deviceStats] = await db.query(`
      SELECT user_agent, COUNT(*) as count
      FROM visitor_sessions
      WHERE last_visit >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY user_agent
      ORDER BY count DESC
      LIMIT 10
    `);

    res.json({
      dailyStats,
      activeSessions: activeSessions[0].active_sessions,
      peakHours,
      deviceStats
    });
  } catch (err) {
    logger.error(`Error fetching visitor analytics: ${err.message}`);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /analytics/platforms - Platform-specific analytics
router.get("/platforms", async (req, res) => {
  logger.info("Fetching platform analytics");
  try {
    // LeetCode stats
    const [leetcodeStats] = await db.query(`
      SELECT 
        AVG(easy_lc) as avg_easy,
        AVG(medium_lc) as avg_medium,
        AVG(hard_lc) as avg_hard,
        MAX(easy_lc + medium_lc + hard_lc) as max_total,
        COUNT(CASE WHEN easy_lc + medium_lc + hard_lc > 0 THEN 1 END) as active_users
      FROM student_performance sp
      JOIN student_coding_profiles cp ON sp.student_id = cp.student_id
      WHERE cp.leetcode_status = 'accepted'
    `);

    // CodeChef stats
    const [codechefStats] = await db.query(`
      SELECT 
        AVG(problems_cc) as avg_problems,
        AVG(contests_cc) as avg_contests,
        AVG(stars_cc) as avg_stars,
        MAX(problems_cc) as max_problems,
        COUNT(CASE WHEN problems_cc > 0 THEN 1 END) as active_users
      FROM student_performance sp
      JOIN student_coding_profiles cp ON sp.student_id = cp.student_id
      WHERE cp.codechef_status = 'accepted'
    `);

    // GeeksforGeeks stats
    const [gfgStats] = await db.query(`
      SELECT 
        AVG(school_gfg + basic_gfg + easy_gfg + medium_gfg + hard_gfg) as avg_total,
        AVG(contests_gfg) as avg_contests,
        MAX(school_gfg + basic_gfg + easy_gfg + medium_gfg + hard_gfg) as max_total,
        COUNT(CASE WHEN school_gfg + basic_gfg + easy_gfg + medium_gfg + hard_gfg > 0 THEN 1 END) as active_users
      FROM student_performance sp
      JOIN student_coding_profiles cp ON sp.student_id = cp.student_id
      WHERE cp.geeksforgeeks_status = 'accepted'
    `);

    // HackerRank stats
    const [hackerrankStats] = await db.query(`
      SELECT 
        AVG(stars_hr) as avg_badges,
        MAX(stars_hr) as max_badges,
        COUNT(CASE WHEN stars_hr > 0 THEN 1 END) as active_users
      FROM student_performance sp
      JOIN student_coding_profiles cp ON sp.student_id = cp.student_id
      WHERE cp.hackerrank_status = 'accepted'
    `);

    res.json({
      leetcode: leetcodeStats[0],
      codechef: codechefStats[0],
      geeksforgeeks: gfgStats[0],
      hackerrank: hackerrankStats[0]
    });
  } catch (err) {
    logger.error(`Error fetching platform analytics: ${err.message}`);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /analytics/trends - Trend analysis
router.get("/trends", async (req, res) => {
  const { timeRange = '30d' } = req.query;
  logger.info(`Fetching trend analytics for ${timeRange}`);
  
  try {
    let days = 30;
    if (timeRange === '7d') days = 7;
    else if (timeRange === '90d') days = 90;

    // Score progression over time
    const [scoreProgression] = await db.query(`
      SELECT DATE(last_updated) as date, AVG(
        (easy_lc + medium_lc + hard_lc) * 2 +
        (school_gfg + basic_gfg + easy_gfg + medium_gfg + hard_gfg) * 1 +
        problems_cc * 3 +
        stars_hr * 10
      ) as avg_score
      FROM student_performance
      WHERE last_updated >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(last_updated)
      ORDER BY date
    `, [days]);

    // Registration trends
    const [registrationTrends] = await db.query(`
      SELECT DATE(created_at) as date, COUNT(*) as registrations
      FROM users u
      JOIN student_profiles sp ON u.user_id = sp.student_id
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY date
    `, [days]);

    // Activity trends
    const [activityTrends] = await db.query(`
      SELECT DATE(last_updated) as date, COUNT(DISTINCT student_id) as active_students
      FROM student_performance
      WHERE last_updated >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(last_updated)
      ORDER BY date
    `, [days]);

    res.json({
      scoreProgression,
      registrationTrends,
      activityTrends
    });
  } catch (err) {
    logger.error(`Error fetching trend analytics: ${err.message}`);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /analytics/summary - Dashboard summary
router.get("/summary", async (req, res) => {
  logger.info("Fetching analytics summary");
  try {
    // Key metrics
    const [summary] = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM student_profiles) as total_students,
        (SELECT COUNT(*) FROM faculty_profiles) as total_faculty,
        (SELECT COUNT(*) FROM hod_profiles) as total_hods,
        (SELECT COUNT(*) FROM student_profiles WHERE score > 0) as active_students,
        (SELECT AVG(score) FROM student_profiles WHERE score > 0) as avg_score,
        (SELECT MAX(score) FROM student_profiles) as max_score,
        (SELECT COUNT(*) FROM contact_requests WHERE status = 'new') as pending_requests,
        (SELECT COUNT(*) FROM student_coding_profiles WHERE 
          leetcode_status = 'pending' OR 
          codechef_status = 'pending' OR 
          geeksforgeeks_status = 'pending' OR 
          hackerrank_status = 'pending'
        ) as pending_verifications
    `);

    // Recent activity
    const [recentActivity] = await db.query(`
      SELECT 'performance_update' as type, student_id as user_id, last_updated as timestamp
      FROM student_performance
      WHERE last_updated >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      UNION ALL
      SELECT 'registration' as type, user_id, created_at as timestamp
      FROM users
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      ORDER BY timestamp DESC
      LIMIT 10
    `);

    res.json({
      summary: summary[0],
      recentActivity
    });
  } catch (err) {
    logger.error(`Error fetching analytics summary: ${err.message}`);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /analytics/realtime - Real-time dashboard data
router.get("/realtime", async (req, res) => {
  logger.info("Fetching real-time analytics");
  try {
    // Total unique visitors by IP
    const [totalVisitors] = await db.query(`
      SELECT COUNT(DISTINCT ip_address) as count 
      FROM visitor_sessions
    `);

    // Active students with score > average score
    const [activeStudents] = await db.query(`
      SELECT COUNT(*) as count
      FROM student_profiles
      WHERE score > (SELECT AVG(score) FROM student_profiles WHERE score > 0)
    `);

    // Recent registrations
    const [recentActivity] = await db.query(`
      SELECT 
        CONCAT('New user ', user_id, ' registered') as message,
        created_at as timestamp
      FROM users
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      ORDER BY created_at DESC
      LIMIT 10
    `);

    // Daily registrations for chart
    const [performanceUpdates] = await db.query(`
      SELECT 
        DATE_FORMAT(created_at, '%H:%i') as time,
        COUNT(*) as updates
      FROM users
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      GROUP BY DATE_FORMAT(created_at, '%H:%i')
      ORDER BY time DESC
      LIMIT 24
    `);

    // Total students count
    const [totalStudents] = await db.query(`
      SELECT COUNT(*) as count FROM student_profiles
    `);

    res.json({
      totalStudents: totalStudents[0].count,
      totalVisitors: totalVisitors[0].count,
      activeStudents: activeStudents[0].count,
      recentActivity: recentActivity.map(activity => ({
        ...activity,
        timestamp: new Date(activity.timestamp).toLocaleString()
      })),
      performanceUpdates
    });
  } catch (err) {
    logger.error(`Error fetching real-time analytics: ${err.message}`);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;