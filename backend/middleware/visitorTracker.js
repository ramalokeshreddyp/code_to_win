const db = require("../config/db");
const crypto = require("crypto");

const visitorTracker = async (req, res, next) => {
  try {
    // Generate session ID based on IP and User-Agent
    const sessionData = `${req.ip}-${req.get('User-Agent')}`;
    const sessionId = crypto.createHash('md5').update(sessionData).digest('hex');
    
    const today = new Date().toISOString().split('T')[0];
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');

    // Check if this session exists
    const [existingSession] = await db.query(
      "SELECT * FROM visitor_sessions WHERE session_id = ?",
      [sessionId]
    );

    let isNewVisitor = false;

    if (existingSession.length === 0) {
      // New visitor
      await db.query(
        "INSERT INTO visitor_sessions (session_id, ip_address, user_agent) VALUES (?, ?, ?)",
        [sessionId, ipAddress, userAgent]
      );
      isNewVisitor = true;
    } else {
      // Update existing session
      await db.query(
        "UPDATE visitor_sessions SET last_visit = CURRENT_TIMESTAMP, visit_count = visit_count + 1 WHERE session_id = ?",
        [sessionId]
      );
    }

    // Update daily stats
    const [existingStats] = await db.query(
      "SELECT * FROM visitor_stats WHERE visit_date = ?",
      [today]
    );

    if (existingStats.length === 0) {
      // Create new daily record
      await db.query(
        "INSERT INTO visitor_stats (visit_date, visitor_count, unique_visitors) VALUES (?, 1, ?)",
        [today, isNewVisitor ? 1 : 0]
      );
    } else {
      // Update existing daily record
      if (isNewVisitor) {
        await db.query(
          "UPDATE visitor_stats SET visitor_count = visitor_count + 1, unique_visitors = unique_visitors + 1 WHERE visit_date = ?",
          [today]
        );
      } else {
        await db.query(
          "UPDATE visitor_stats SET visitor_count = visitor_count + 1 WHERE visit_date = ?",
          [today]
        );
      }
    }

    next();
  } catch (error) {
    console.error("Visitor tracking error:", error);
    next(); // Continue even if tracking fails
  }
};

module.exports = visitorTracker;