const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { logger } = require("./utils"); // <-- Add this line
const cron = require("node-cron");
const {
  updateAllStudentsPerformance,
} = require("./scrapers/scrapeAndUpdatePerformance");
const visitorTracker = require("./middleware/visitorTracker");
const app = express();
app.use(cors());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Visitor tracking middleware
app.use(visitorTracker);

// Log every request globally
app.use((req, res, next) => {
  logger.info(
    `[${req.method}] ${req.originalUrl} | query: ${JSON.stringify(req.query)}`
  );
  next();
});

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/student", require("./routes/studentRoutes"));
app.use("/api/faculty", require("./routes/facultyRoutes"));
app.use("/api/hod", require("./routes/hodRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/admin/analytics", require("./routes/analyticsRoutes"));
app.use("/api/ranking", require("./routes/rankingRoutes"));
app.use("/api/meta", require("./routes/metaRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/contact", require("./routes/contactRoutes"));
app.use("/api/export", require("./routes/exportRoutes"));
app.use("/api/download", require("./routes/downloadRoutes"));
app.use("/api/", require("./routes/managementRoutes"));

// Schedule: Every Saturday at 00:00 (midnight)
cron.schedule("0 0 * * 6", async () => {
  logger.info("[CRON] Starting weekly student performance update...");
  await updateAllStudentsPerformance();
  logger.info("[CRON] Weekly student performance update finished.");
});

// updateAllStudentsPerformance(); // Initial run on server start

// Schedule: Every day at 03:00 AM - Update rankings
cron.schedule("0 3 * * *", async () => {
  logger.info("[CRON] Starting daily ranking update...");
  const updateRankings = require("./updateRankings");
  try {
    const result = await updateRankings();
    logger.info(
      `[CRON] Daily ranking update finished: ${result.studentsUpdated} students updated`
    );
  } catch (error) {
    logger.error(`[CRON] Error in daily ranking update: ${error.message}`);
  }
});

// Schedule: Every 5 minutes - Clean up inactive visitors
cron.schedule("*/5 * * * *", async () => {
  try {
    const db = require("./config/db");
    await db.query(
      "UPDATE visitor_sessions SET is_active = 0 WHERE last_visit < DATE_SUB(NOW(), INTERVAL 5 MINUTE)"
    );
  } catch (error) {
    logger.error(`[CRON] Error cleaning up visitors: ${error.message}`);
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`Server is running on http://localhost:${PORT}`)
);
