const db = require("./config/db");
const fs = require("fs");
const path = require("path");
const { logger } = require("./utils");

async function runMigration() {
  try {
    const sqlPath = path.join(
      __dirname,
      "migrations",
      "migration_achievements.sql"
    );
    const sql = fs.readFileSync(sqlPath, "utf8");

    // Split by statement, but handle the DELIMITER logic crudely or just run standard statements
    // Since mysql2 doesn't support generic DELIMITER parsing effortlessly,
    // we'll run the CREATE TABLE and INSERTs separately if possible,
    // OR we can rely on multipleStatements: true if enabled.
    // Given the complexity of the Stored Procedure for idempotency,
    // let's try to run it. If it fails, we might need a simpler approach for this environs.

    // Simpler approach: Just try ALTERs and ignore errors if columns exist?
    // Or just run the file. 'db.query' might support multiple statements if configured.

    // Let's try executing the whole block if multipleStatements is on.
    // If not, we might need to break it down.

    // Actually, for safety in this specific node script, let's just use raw queries
    // for the table and inserts, and try-catch the ALTERS.

    logger.info("Running Achievements Migration...");

    // 1. Create Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS student_achievements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id VARCHAR(255) NOT NULL,
        type ENUM('certification', 'hackathon', 'workshop') NOT NULL,
        title VARCHAR(255) NOT NULL,
        org_name VARCHAR(255) NOT NULL,
        date DATE NOT NULL,
        description TEXT,
        file_path VARCHAR(255),
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        approved_by VARCHAR(255),
        rejection_reason TEXT,
        points_awarded INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_achievements_student FOREIGN KEY (student_id) REFERENCES users(user_id) ON DELETE CASCADE
      );
    `);
    logger.info("Checked/Created student_achievements table.");

    // 2. Insert Grading metrics
    await db.query(`
      INSERT IGNORE INTO grading_system (metric, points) VALUES 
      ('certification_count', 5),
      ('hackathon_count', 10),
      ('workshop_count', 5);
    `);
    logger.info("Inserted grading metrics.");

    // 3. Alter Table (One by one, ignoring "Duplicate column" error)
    const alterQueries = [
      "ALTER TABLE student_performance ADD COLUMN certification_count INT DEFAULT 0",
      "ALTER TABLE student_performance ADD COLUMN hackathon_count INT DEFAULT 0",
      "ALTER TABLE student_performance ADD COLUMN workshop_count INT DEFAULT 0",
    ];

    for (const q of alterQueries) {
      try {
        await db.query(q);
        logger.info(`Executed: ${q}`);
      } catch (err) {
        if (err.code === "ER_DUP_FIELDNAME") {
          logger.info(`Skipped (already exists): ${q}`);
        } else {
          throw err;
        }
      }
    }

    logger.info("Migration completed successfully.");
    process.exit(0);
  } catch (err) {
    logger.error(`Migration failed: ${err.message}`);
    console.error(err);
    process.exit(1);
  }
}

runMigration();
