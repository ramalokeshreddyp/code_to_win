const express = require("express");
const router = express.Router();
const db = require("../config/db"); // MySQL connection

const bcrypt = require("bcryptjs");
const multer = require("multer");
const csv = require("csv-parse");
const fs = require("fs");
const path = require("path");
const { logger } = require("../utils"); // <-- Add logger
const {
  scrapeAndUpdatePerformance,
} = require("../scrapers/scrapeAndUpdatePerformance");
const scrapeLeetCodeProfile = require("../scrapers/leetcode");
const scrapeCodeChefProfile = require("../scrapers/codechef");
const scrapeHackerRankProfile = require("../scrapers/hackerrank");
const scrapeGeeksForGeeksProfile = require("../scrapers/geeksforgeeks");

// Configure multer for CSV uploads
const upload = multer({
  dest: "uploads/",
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "text/csv") {
      logger.warn(`Rejected file upload: Not a CSV (${file.originalname})`);
      return cb(new Error("Only CSV files are allowed"));
    }
    cb(null, true);
  },
});

// Add branch
router.post("/add-branch", async (req, res) => {
  const { dept_code, dept_name } = req.body;
  if (!dept_code || !dept_name) {
    logger.warn("Missing dept_code or dept_name in add-branch");
    return res
      .status(400)
      .json({ message: "dept_code and dept_name are required" });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    logger.info(`Adding branch: ${dept_code}, ${dept_name}`);

    await connection.query(
      "INSERT INTO dept (dept_code, dept_name) VALUES (?, ?)",
      [dept_code, dept_name]
    );

    await connection.commit();
    logger.info(`Branch added successfully: ${dept_code}`);
    res.status(200).json({ message: "Branch added successfully" });
  } catch (err) {
    await connection.rollback();
    logger.error(`Error adding branch: ${err.message}`);
    res.status(500).json({
      message:
        err.code === "ER_DUP_ENTRY"
          ? `Branch with code '${dept_code}' already exists`
          : err.message,
      error: err.errno,
    });
  } finally {
    connection.release();
  }
});

// Add a new student (first to users, then to student_profiles)
router.post("/add-student", async (req, res) => {
  const { stdId, name, dept, year, section, degree } = req.body;
  logger.info(`Add student request: ${JSON.stringify(req.body)}`);
  const connection = await db.getConnection(); // Use a connection from the pool

  try {
    await connection.beginTransaction();
    logger.info(
      `Adding student: ${stdId}, ${name}, ${dept}, ${year}, ${section}, ${degree}`
    );

    const hashed = await bcrypt.hash("student@aditya", 10);

    // 1. Insert into users table
    const [result] = await connection.query(
      `INSERT INTO users (user_id, email, password, role) VALUES (?,?, ?, ?)`,
      [stdId, stdId + "@aec.edu.in", hashed, "student"]
    );

    // 2. Insert into student_profiles table
    const currentYearNum = new Date().getFullYear();
    const batchYear = currentYearNum - (parseInt(year) - 1);

    await connection.query(
      `INSERT INTO student_profiles 
        (student_id, name, dept_code, year, section, degree, batch)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [stdId, name, dept, year, section, degree, batchYear]
    );
    await connection.query(
      `INSERT INTO student_performance 
      (student_id) 
      VALUES (?);`,
      [stdId]
    );

    await connection.commit();
    logger.info(`Student added successfully: ${stdId}`);
    res.status(200).json({ message: "Student added successfully" });
  } catch (err) {
    await connection.rollback();
    logger.error(`Error adding student: ${err.message}`);
    res.status(500).json({
      message:
        err.code === "ER_DUP_ENTRY"
          ? `Student with ID ${stdId} already exists`
          : err.message,
      error: err.errno,
    });
  } finally {
    connection.release();
  }
});

// Add a new faculty
router.post("/add-faculty", async (req, res) => {
  const { facultyId, name, dept, email } = req.body;
  logger.info(`Add faculty request: ${JSON.stringify(req.body)}`);

  const connection = await db.getConnection(); // Use a connection from the pool

  try {
    await connection.beginTransaction();
    logger.info(`Adding faculty: ${facultyId}, ${name}, ${dept}, ${email}`);

    const hashed = await bcrypt.hash("faculty@aditya", 10);

    // 1. Insert into users table
    const [result] = await connection.query(
      `INSERT INTO users (user_id, email, password, role) VALUES (?,?, ?, ?)`,
      [facultyId, email, hashed, "faculty"]
    );

    // 2. Insert into faculty_profiles table
    await connection.query(
      `INSERT INTO faculty_profiles 
        (faculty_id, name, dept_code)
        VALUES (?, ?, ?)`,
      [facultyId, name, dept]
    );
    await connection.query(
      `INSERT INTO faculty_section_assignment (faculty_id) VALUES (?)`,
      [facultyId]
    );

    await connection.commit();
    logger.info(`Faculty added successfully: ${facultyId}`);
    res.status(200).json({ message: "Faculty added successfully" });
  } catch (err) {
    await connection.rollback();
    logger.error(`Error adding faculty: ${err.message}`);
    res.status(500).json({
      message:
        err.code === "ER_DUP_ENTRY"
          ? `Faculty with ID ${facultyId} already exists`
          : err.message,
      error: err.errno,
    });
  } finally {
    connection.release();
  }
});

// Add a new hod
router.post("/add-hod", async (req, res) => {
  const { hodId, name, dept, email } = req.body;
  logger.info(`Add HOD request: ${JSON.stringify(req.body)}`);

  const connection = await db.getConnection(); // Use a connection from the pool

  try {
    await connection.beginTransaction();
    logger.info(`Adding HOD: ${hodId}, ${name}, ${dept}, ${email}`);

    const hashed = await bcrypt.hash("hod@aditya", 10);

    // 1. Insert into users table
    const [result] = await connection.query(
      `INSERT INTO users (user_id, email, password, role) VALUES (?,?, ?, ?)`,
      [hodId, email, hashed, "hod"]
    );

    // 2. Insert into hod_profiles table
    await connection.query(
      `INSERT INTO hod_profiles 
        (hod_id, name, dept_code)
        VALUES (?, ?, ?)`,
      [hodId, name, dept]
    );

    await connection.commit();
    logger.info(`HOD added successfully: ${hodId}`);
    res.status(200).json({ message: "HOD added successfully" });
  } catch (err) {
    await connection.rollback();
    logger.error(`Error adding HOD: ${err.message}`);
    res.status(500).json({
      message:
        err.code === "ER_DUP_ENTRY"
          ? `HOD with ID ${hodId} already exists`
          : err.message,
      error: err.errno,
    });
  } finally {
    connection.release();
  }
});

// POST /api/add-deputy-hod - Add a new Deputy HOD
router.post("/add-deputy-hod", async (req, res) => {
  const { deputyHodId, name, dept, email } = req.body;
  logger.info(`Add Deputy HOD request: ${JSON.stringify(req.body)}`);

  const connection = await db.getConnection(); // Use a connection from the pool

  try {
    await connection.beginTransaction();
    logger.info(`Adding Deputy HOD: ${deputyHodId}, ${name}, ${dept}, ${email}`);

    const [columnCheck] = await connection.query(
      `SELECT COUNT(*) AS column_exists
       FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'hod_profiles'
         AND COLUMN_NAME = 'is_deputy_hod'`
    );
    if (!columnCheck[0]?.column_exists) {
      await connection.rollback();
      logger.error("Deputy HOD migration missing: hod_profiles.is_deputy_hod");
      return res.status(500).json({
        message:
          "Deputy HOD support is not installed. Run the add_deputy_hod_support.sql migration.",
      });
    }

    const hashed = await bcrypt.hash("hod@aditya", 10);

    // 1. Insert into users table with "hod" role (Deputy HODs use HOD login)
    const [result] = await connection.query(
      `INSERT INTO users (user_id, email, password, role) VALUES (?,?, ?, ?)`,
      [deputyHodId, email, hashed, "hod"]
    );

    // 2. Insert into hod_profiles table with is_deputy_hod flagged as TRUE
    await connection.query(
      `INSERT INTO hod_profiles 
        (hod_id, name, dept_code, is_deputy_hod)
        VALUES (?, ?, ?, ?)`,
      [deputyHodId, name, dept, true]
    );

    await connection.commit();
    logger.info(`Deputy HOD added successfully: ${deputyHodId}`);
    res.status(200).json({ message: "Deputy HOD added successfully" });
  } catch (err) {
    await connection.rollback();
    logger.error(`Error adding Deputy HOD: ${err.message}`);
    res.status(500).json({
      message:
        err.code === "ER_DUP_ENTRY"
          ? `Deputy HOD with ID ${deputyHodId} already exists`
          : err.message,
      error: err.errno,
    });
  } finally {
    connection.release();
  }
});

//P0ST /api/reset-password
router.post("/reset-password", async (req, res) => {
  const { userId, password } = req.body;
  if (!userId || !password) {
    logger.warn("Missing required fields in reset-password");
    return res.status(400).json({ message: "Missing required fields" });
  }

  const connection = await db.getConnection();
  try {
    const hashed = await bcrypt.hash(password, 10);
    const [result] = await connection.query(
      "UPDATE users SET password = ? WHERE user_id = ?",
      [hashed, userId]
    );
    if (result.affectedRows === 0) {
      logger.warn(`User not found for reset-password: ${userId}`);
      return res.status(404).json({ message: "User not found" });
    }
    logger.info(`Password reset successful for user: ${userId}`);
    res.json({ message: "Password reset successful" });
  } catch (err) {
    logger.error(`Error resetting password for user ${userId}: ${err.message}`);
    res.status(500).json({ message: "Server error", error: err.message });
  } finally {
    connection.release();
  }
});

//P0ST /api/delete-user
router.post("/delete-user", async (req, res) => {
  const { userId, role } = req.body;
  if (!userId || !role) {
    logger.warn("Missing userId or role in delete-user");
    return res.status(400).json({ message: "Missing userId or role" });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    logger.info(`Deleting user: ${userId}, role: ${role}`);

    // Delete from role-specific profile table first
    if (role === "student") {
      await connection.query(
        "DELETE FROM student_coding_profiles WHERE student_id = ?",
        [userId]
      );
      await connection.query(
        "DELETE FROM student_performance WHERE student_id = ?",
        [userId]
      );
      await connection.query(
        "DELETE FROM student_profiles WHERE student_id = ?",
        [userId]
      );
    } else if (role === "faculty") {
      await connection.query(
        "DELETE FROM faculty_section_assignment WHERE faculty_id = ?",
        [userId]
      );
      await connection.query(
        "DELETE FROM faculty_profiles WHERE faculty_id = ?",
        [userId]
      );
    } else if (role === "hod") {
      await connection.query("DELETE FROM hod_profiles WHERE hod_id = ?", [
        userId,
      ]);
    }

    // Delete from users table
    const [result] = await connection.query(
      "DELETE FROM users WHERE user_id = ? AND role = ?",
      [userId, role]
    );
    await connection.commit();

    if (result.affectedRows === 0) {
      logger.warn(`User not found for delete-user: ${userId}, role: ${role}`);
      return res.status(404).json({ message: "User not found" });
    }

    logger.info(`User deleted successfully: ${userId}, role: ${role}`);
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    await connection.rollback();
    logger.error(`Error deleting user ${userId}, role ${role}: ${err.message}`);
    res.status(500).json({ message: "Server error", error: err.message });
  } finally {
    connection.release();
  }
});

//P0ST /api/bulk-import-student
router.post("/bulk-import-student", upload.single("file"), async (req, res) => {
  const { dept, year, section } = req.body;
  logger.info(
    `Bulk import students: dept=${dept}, year=${year}, section=${section}`
  );
  const connection = await db.getConnection();

  try {
    if (!req.file) {
      logger.warn("No file uploaded for bulk-import-student");
      return res.status(400).json({ message: "No file uploaded" });
    }

    const results = [];
    const errors = [];

    // Read and parse CSV file
    const fileRows = await new Promise((resolve, reject) => {
      const rows = [];
      fs.createReadStream(req.file.path)
        .pipe(csv.parse({ columns: true, trim: true }))
        .on("data", (row) => rows.push(row))
        .on("error", (error) => reject(error))
        .on("end", () => resolve(rows));
    });

    logger.info(`Parsed ${fileRows.length} student rows from CSV`);
    await connection.beginTransaction();

    for (const row of fileRows) {
      const hashed = await bcrypt.hash("student@aditya", 10);
      const stdId = row["Student Id"];
      const name = row["Student Name"];
      const email = `${stdId}@aec.edu.in`;
      try {
        // Insert into users table
        await connection.query(
          "INSERT INTO users (user_id, email, password, role) VALUES (?, ?, ?, ?)",
          [stdId, email, hashed, "student"]
        );
        if (stdId === "" || name == "" || row.Degree == "") {
          logger.warn(`Missing fields in CSV row: ${JSON.stringify(row)}`);
          errors.push({
            error: `Check the fields in CSV and upload.`,
          });
        }
        // Insert into student_profiles table
        const currYear = new Date().getFullYear();
        const bch = currYear - (parseInt(year) - 1);
        await connection.query(
          `INSERT INTO student_profiles 
           (student_id, name, dept_code, year, section, degree, batch)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [stdId, name, dept, year, section, row.Degree, bch]
        );
        await connection.query(
          `INSERT INTO student_performance (student_id) VALUES (?);`,
          [stdId]
        );

        results.push({ stdId: stdId, status: "success" });
        logger.info(`Student imported: ${stdId}`);
      } catch (err) {
        logger.error(`Error importing student ${stdId}: ${err.message}`);
        errors.push({
          error:
            err.code === "ER_DUP_ENTRY"
              ? `Student with ID ${stdId} already exists`
              : err.code === "ER_BAD_NULL_ERROR"
              ? `Check fields in CSV and upload again`
              : err.message,
        });
      }
    }

    // Delete the temporary file
    fs.unlinkSync(req.file.path);

    if (errors.length === fileRows.length) {
      // If all entries failed, rollback
      await connection.rollback();
      logger.warn("Bulk import students failed: all entries failed");
      return res.status(400).json({
        message: "Bulk import failed",
        errors,
      });
    }

    // Commit if at least some entries succeeded
    await connection.commit();
    logger.info(
      `Bulk import students completed: ${results.length} succeeded, ${errors.length} failed`
    );

    res.json({
      message: "Bulk import completed",
      totalProcessed: fileRows.length,
      successful: results.length,
      failed: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    await connection.rollback();
    logger.error(`Bulk import students error: ${err.message}`);

    // Delete the temporary file in case of error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ message: "Server error", error: err.message });
  } finally {
    connection.release();
  }
});

//P0ST /api/bulk-import-faculty
router.post("/bulk-import-faculty", upload.single("file"), async (req, res) => {
  const { dept } = req.body;
  logger.info(`Bulk import faculty: dept=${dept}`);
  const connection = await db.getConnection();

  try {
    if (!req.file) {
      logger.warn("No file uploaded for bulk-import-faculty");
      return res.status(400).json({ message: "No file uploaded" });
    }

    const results = [];
    const errors = [];

    // Read and parse CSV file
    const fileRows = await new Promise((resolve, reject) => {
      const rows = [];
      fs.createReadStream(req.file.path)
        .pipe(csv.parse({ columns: true, trim: true }))
        .on("data", (row) => rows.push(row))
        .on("error", (error) => reject(error))
        .on("end", () => resolve(rows));
    });

    logger.info(`Parsed ${fileRows.length} faculty rows from CSV`);
    await connection.beginTransaction();

    for (const row of fileRows) {
      const hashed = await bcrypt.hash("faculty@aditya", 10);
      const facultyId = row["Faculty Id"];
      const name = row["Faculty Name"];
      const email = row["Faculty Email"];
      const section = row["Faculty Incharge Section"];
      const year = row["Faculty Incharge Year"];
      try {
        // Insert into users table
        await connection.query(
          "INSERT INTO users (user_id, email, password, role) VALUES (?, ?, ?, ?)",
          [facultyId, email, hashed, "faculty"]
        );

        // Insert into faculty_profiles table
        await connection.query(
          `INSERT INTO faculty_profiles 
           (faculty_id, name, dept_code)
           VALUES (?, ?, ?)`,
          [facultyId, name, dept]
        );
        await connection.query(
          "Insert into faculty_section_assignment (faculty_id, section, year) VALUES (?, ?, ?)",
          [facultyId, section, year]
        );

        results.push({ facultyId: facultyId, status: "success" });
        logger.info(`Faculty imported: ${facultyId}`);
      } catch (err) {
        logger.error(`Error importing faculty ${facultyId}: ${err.message}`);
        errors.push({
          error:
            err.code === "ER_DUP_ENTRY"
              ? `Faculty with ID ${facultyId} already exists`
              : err.code === "ER_BAD_NULL_ERROR"
              ? `Check fields in CSV and upload again`
              : err.message,
        });
      }
    }

    // Delete the temporary file
    fs.unlinkSync(req.file.path);

    if (errors.length === fileRows.length) {
      // If all entries failed, rollback
      await connection.rollback();
      logger.warn("Bulk import faculty failed: all entries failed");
      return res.status(400).json({
        message: "Bulk import failed",
        errors,
      });
    }

    // Commit if at least some entries succeeded
    await connection.commit();
    logger.info(
      `Bulk import faculty completed: ${results.length} succeeded, ${errors.length} failed`
    );

    res.json({
      message: "Bulk import completed",
      totalProcessed: fileRows.length,
      successful: results.length,
      failed: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    await connection.rollback();
    logger.error(`Bulk import faculty error: ${err.message}`);

    // Delete the temporary file in case of error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ message: "Server error", error: err.message });
  } finally {
    connection.release();
  }
});

router.post("/bulk-import-with-cp", upload.single("file"), async (req, res) => {
  const { dept, year, section } = req.body;
  logger.info(
    `Bulk import with CP: dept=${dept}, year=${year}, section=${section}`
  );
  const connection = await db.getConnection();

  try {
    if (!req.file) {
      logger.warn("No file uploaded for bulk-import-with-cp");
      return res.status(400).json({ message: "No file uploaded" });
    }

    const results = [];
    const errors = [];

    // Read and parse CSV file
    const fileRows = await new Promise((resolve, reject) => {
      const rows = [];
      fs.createReadStream(req.file.path)
        .pipe(csv.parse({ columns: true, trim: true }))
        .on("data", (row) => rows.push(row))
        .on("error", (error) => reject(error))
        .on("end", () => resolve(rows));
    });

    logger.info(`Parsed ${fileRows.length} student rows from CSV`);
    await connection.beginTransaction();

    for (const row of fileRows) {
      const stdId = row["Student Id"];
      const hashed = await bcrypt.hash(stdId, 10);
      const name = row["Student Name"];
      const email = `${stdId}@aec.edu.in`;
      try {
        // Insert into users table
        await connection.query(
          "INSERT INTO users (user_id, email, password, role) VALUES (?, ?, ?, ?)",
          [stdId, email, hashed, "student"]
        );
        if (!stdId || !name || !row.Degree) {
          logger.warn(`Missing fields in CSV row: ${JSON.stringify(row)}`);
          errors.push({
            error: `Check the fields in CSV and upload.`,
          });
          continue;
        }
        // Insert into student_profiles table
        const cYear = new Date().getFullYear();
        const btch = cYear - (parseInt(year) - 1);
        await connection.query(
          `INSERT INTO student_profiles 
           (student_id, name, dept_code, year, section, degree, gender, batch)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [stdId, name, dept, year, section, row.Degree, row.Gender, btch]
        );
        await connection.query(
          `INSERT INTO student_performance (student_id) VALUES (?);`,
          [stdId]
        );

        // Insert into student_coding_profiles table
        await connection.query(
          `INSERT INTO student_coding_profiles 
    (student_id, hackerrank_id, leetcode_id, codechef_id, geeksforgeeks_id,
     hackerrank_status, leetcode_status, codechef_status, geeksforgeeks_status,
     hackerrank_verified, leetcode_verified, codechef_verified, geeksforgeeks_verified)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            stdId,
            row.HackerRank || null,
            row.LeetCode || null,
            row.CodeChef || null,
            row.GeeksforGeeks || null,
            "accepted", // hackerrank_status
            "accepted", // leetcode_status
            "accepted", // codechef_status
            "accepted", // geeksforgeeks_status
            1, // hackerrank_verified
            1, // leetcode_verified
            1, // codechef_verified
            1, // geeksforgeeks_verified
          ]
        );

        // After inserting into student_coding_profiles table:
        if (row.HackerRank) {
          scrapeAndUpdatePerformance(stdId, "hackerrank", row.HackerRank);
        }
        if (row.LeetCode) {
          scrapeAndUpdatePerformance(stdId, "leetcode", row.LeetCode);
        }
        if (row.CodeChef) {
          scrapeAndUpdatePerformance(stdId, "codechef", row.CodeChef);
        }
        if (row.GeeksforGeeks) {
          scrapeAndUpdatePerformance(stdId, "geeksforgeeks", row.GeeksforGeeks);
        }

        results.push({ stdId: stdId, status: "success" });
        logger.info(`Student imported: ${stdId}`);
      } catch (err) {
        logger.error(`Error importing student ${stdId}: ${err.message}`);
        errors.push({
          error:
            err.code === "ER_DUP_ENTRY"
              ? `Student with ID ${stdId} already exists`
              : err.code === "ER_BAD_NULL_ERROR"
              ? `Check fields in CSV and upload again`
              : err.message,
        });
      }
    }

    // Delete the temporary file
    fs.unlinkSync(req.file.path);

    if (errors.length === fileRows.length) {
      // If all entries failed, rollback
      await connection.rollback();
      logger.warn("Bulk import students failed: all entries failed");
      return res.status(400).json({
        message: "Bulk import failed",
        totalProcessed: fileRows.length,
        errors,
      });
    }

    // Commit if at least some entries succeeded
    await connection.commit();
    logger.info(
      `Bulk import students completed: ${results.length} succeeded, ${errors.length} failed`
    );

    res.json({
      message: "Bulk import completed",
      totalProcessed: fileRows.length,
      successful: results.length,
      failed: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    await connection.rollback();
    logger.error(`Bulk import students error: ${err.message}`);

    // Delete the temporary file in case of error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({ message: "Server error", error: err.message });
  } finally {
    connection.release();
  }
});

router.post("/check-score", async (req, res) => {
  try {
    const { profiles } = req.body;
    logger.info(`Check Score`);

    if (!profiles || !Array.isArray(profiles) || profiles.length === 0) {
      return res.status(404).json({ message: "No coding profiles found" });
    }
    logger.info("Profiles:", profiles);

    const profile = profiles[0];
    const results = {};

    const tasks = [];

    if (profile.leetcode_id) {
      tasks.push(
        scrapeLeetCodeProfile(`https://leetcode.com/u/${profile.leetcode_id}`)
          .then((data) => {
            results.leetcode = data;
          })
          .catch((err) => {
            logger.error(`[FETCH] LeetCode: ${err.message}`);
            results.leetcode = null;
          })
      );
    }
    if (profile.codechef_id) {
      tasks.push(
        scrapeCodeChefProfile(
          `https://www.codechef.com/users/${profile.codechef_id}`
        )
          .then((data) => {
            results.codechef = data;
          })
          .catch((err) => {
            logger.error(`[FETCH] CodeChef: ${err.message}`);
            results.codechef = null;
          })
      );
    }
    if (profile.geeksforgeeks_id) {
      tasks.push(
        scrapeGeeksForGeeksProfile(
          `https://www.geeksforgeeks.org/user/${profile.geeksforgeeks_id}`
        )
          .then((data) => {
            results.geeksforgeeks = data;
          })
          .catch((err) => {
            logger.error(`[FETCH] GFG: ${err.message}`);
            results.geeksforgeeks = null;
          })
      );
    }
    if (profile.hackerrank_id) {
      tasks.push(
        scrapeHackerRankProfile(
          `https://www.hackerrank.com/profile/${profile.hackerrank_id}`
        )
          .then((data) => {
            results.hackerrank = data;
          })
          .catch((err) => {
            logger.error(`[FETCH] HackerRank: ${err.message}`);
            results.hackerrank = null;
          })
      );
    }

    await Promise.all(tasks);

    logger.info(`Completed fetch for ${tasks.length} coding profiles.`);
    res.json({
      data: results,
    });
  } catch (err) {
    logger.error(`Error fetching coding profiles: ${err.stack || err.message}`);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/management/promote-batch
router.post("/promote-batch", async (req, res) => {
  const { dept, fromYear } = req.body;
  logger.info(`Bulk promotion request: dept=${dept}, fromYear=${fromYear}`);

  if (!dept || !fromYear) {
    return res
      .status(400)
      .json({ message: "Department and Year are required" });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      `UPDATE student_profiles 
       SET year = year + 1 
       WHERE dept_code = ? AND year = ? AND status = 'active'`,
      [dept, fromYear]
    );

    await connection.commit();
    logger.info(
      `Promoted ${result.affectedRows} students from Year ${fromYear} in ${dept}`
    );
    res.json({
      message: `Successfully promoted ${result.affectedRows} students.`,
      affectedRows: result.affectedRows,
    });
  } catch (err) {
    await connection.rollback();
    logger.error(`Error in bulk promotion: ${err.message}`);
    res.status(500).json({ message: "Server error", error: err.message });
  } finally {
    connection.release();
  }
});

// POST /api/management/graduate-batch
router.post("/graduate-batch", async (req, res) => {
  const { dept } = req.body;
  logger.info(`Bulk graduation request: dept=${dept}`);

  if (!dept) {
    return res.status(400).json({ message: "Department is required" });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Mark Year 4 as graduated
    const [result] = await connection.query(
      `UPDATE student_profiles 
       SET status = 'graduated' 
       WHERE dept_code = ? AND year = 4 AND status = 'active'`,
      [dept]
    );

    await connection.commit();
    logger.info(`Graduated ${result.affectedRows} students in ${dept}`);
    res.json({
      message: `Successfully graduated ${result.affectedRows} students.`,
      affectedRows: result.affectedRows,
    });
  } catch (err) {
    await connection.rollback();
    logger.error(`Error in bulk graduation: ${err.message}`);
    res.status(500).json({ message: "Server error", error: err.message });
  } finally {
    connection.release();
  }
});

module.exports = router;
