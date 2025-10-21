const db = require("../config/db");
const crypto = require("crypto");

const visitorTracker = async (req, res, next) => {
  try {
    // Only track non-API requests (actual page visits)
    if (req.path.startsWith('/api/')) {
      return next();
    }

    // Generate session ID based on IP and User-Agent
    const sessionData = `${req.ip}-${req.get('User-Agent')}`;
    const sessionId = crypto.createHash('md5').update(sessionData).digest('hex');
    
    const today = new Date().toISOString().split('T')[0];
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');

    // Check if this session was already counted today
    const [existingSession] = await db.query(
      "SELECT * FROM visitor_sessions WHERE session_id = ? AND DATE(last_visit) = CURDATE()",
      [sessionId]
    );

    let isNewVisitor = false;

    if (existingSession.length === 0) {
      // New visitor for today
      await db.query(
        "INSERT INTO visitor_sessions (session_id, ip_address, user_agent, is_active) VALUES (?, ?, ?, 1) ON DUPLICATE KEY UPDATE last_visit = CURRENT_TIMESTAMP, is_active = 1",
        [sessionId, ipAddress, userAgent]
      );
      isNewVisitor = true;

      // Update daily stats only for new visitors
      const [existingStats] = await db.query(
        "SELECT * FROM visitor_stats WHERE visit_date = ?",
        [today]
      );

      if (existingStats.length === 0) {
        await db.query(
          "INSERT INTO visitor_stats (visit_date, visitor_count, unique_visitors) VALUES (?, 1, 1)",
          [today]
        );
      } else {
        await db.query(
          "UPDATE visitor_stats SET visitor_count = visitor_count + 1, unique_visitors = unique_visitors + 1 WHERE visit_date = ?",
          [today]
        );
      }
    } else {
      // Just update activity status for existing visitor
      await db.query(
        "UPDATE visitor_sessions SET last_visit = CURRENT_TIMESTAMP, is_active = 1 WHERE session_id = ?",
        [sessionId]
      );
    }

    next();
  } catch (error) {
    console.error("Visitor tracking error:", error);
    next(); // Continue even if tracking fails
  }
};

module.exports = visitorTracker;