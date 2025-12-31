const db = require("./config/db");
const { logger } = require("./utils");

async function runMigration() {
  try {
    logger.info("Starting GitHub migration...");

    // 1. Add GitHub columns to student_coding_profiles
    await db.query(`
      ALTER TABLE student_coding_profiles
      ADD COLUMN github_id VARCHAR(255) DEFAULT NULL AFTER hackerrank_id,
      ADD COLUMN github_status ENUM('pending', 'accepted', 'rejected', 'suspended') DEFAULT 'pending' AFTER hackerrank_verified,
      ADD COLUMN github_verified TINYINT(1) DEFAULT 0 AFTER github_status
    `);
    logger.info("Added columns to student_coding_profiles");

    // 2. Add GitHub stats to student_performance
    await db.query(`
      ALTER TABLE student_performance
      ADD COLUMN repos_gh INT DEFAULT 0 AFTER stars_hr,
      ADD COLUMN contributions_gh INT DEFAULT 0 AFTER repos_gh
    `);
    logger.info("Added columns to student_performance");

    // 3. Add GitHub metrics to grading_system
    await db.query(
      "INSERT INTO grading_system (metric, points) VALUES ('repos_gh', 5)"
    );
    await db.query(
      "INSERT INTO grading_system (metric, points) VALUES ('contributions_gh', 1)"
    );
    logger.info("Added metrics to grading_system");

    logger.info("GitHub migration completed successfully!");
    process.exit(0);
  } catch (err) {
    logger.error("Migration failed: " + err.message);
    process.exit(1);
  }
}

runMigration();
