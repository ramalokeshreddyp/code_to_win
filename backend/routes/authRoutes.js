const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const nodemailer = require("nodemailer");
const { logger } = require("../utils");
const {
  scrapeAndUpdatePerformance,
} = require("../scrapers/scrapeAndUpdatePerformance");
const { normalizeUserId, isValidUserId } = require("../utils/userValidation");

require("dotenv").config();

// Email configuration
const transports = [
  { user: "codetracker.info1@gmail.com", pass: "jdjb vobp uoro buhm" },
  { user: "codetracker.info2@gmail.com", pass: "wihf kkpn mpnf fglv" },
];

let i = 0;
function getNextTransporter() {
  const creds = transports[i % transports.length];
  i = (i + 1) % transports.length;
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: creds,
  });
}

const sendNewRegistrationMail = async (email, name, userId, password) => {
  const mailOptions = {
    from: "codetracker.info@gmail.com",
    to: email,
    subject: "Your Login Details - Code Tracker",
    html: `
      <h2>Welcome to Code Tracker!</h2>
      <p>Dear ${name},</p>
      <p>Your registration has been successful. Here are your login details:</p>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
        <p><strong>User ID:</strong> ${userId}</p>
        <p><strong>Password:</strong> ${password}</p>
      </div>
      <a href="http://210.212.210.92:3000" style="display: inline-block; padding: 10px 15px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Login Now</a>
      <p>Please keep these credentials safe and change your password after first login.</p>
      <p>Best regards,<br>Code Tracker Team</p>
    `,
  };

  try {
    const transporter = getNextTransporter();
    await transporter.sendMail(mailOptions);
    logger.info(`Login details email sent to ${email}`);
    return true;
  } catch (error) {
    logger.error(`Failed to send email to ${email}: ${error.message}`);
    return false;
  }
};

// Login a user
router.post("/login", async (req, res) => {
  const { userId: rawUserId, password, role } = req.body;
  
  // Normalize userId
  const userId = normalizeUserId(rawUserId);
  
  logger.info(`Login attempt: userId=${userId}, role=${role}`);
  
  // Input validation
  if (!userId || !password || !role) {
    logger.warn("Missing userId, password, or role in login");
    return res.status(400).json({
      message: "User Id, password and role are required",
    });
  }
  
  if (!isValidUserId(userId, role)) {
    logger.warn(`Invalid userId format: ${rawUserId}`);
    return res.status(400).json({
      message: "Invalid User ID format",
    });
  }
  try {
    const [rows] = await db.query(
      "SELECT * FROM users WHERE user_id = ? AND role = ?",
      [userId, role]
    );

    if (rows.length === 0) {
      logger.warn(
        `User not found or wrong role: userId=${userId}, role=${role}`
      );
      return res
        .status(401)
        .json({ message: "User not found or Check the role." });
    }

    const user = rows[0];

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      logger.warn(`Invalid password for userId=${userId}`);
      return res.status(401).json({ message: "Invalid password" });
    }

    // Check if account is active
    if (!user.is_active) {
      logger.warn(`Inactive account login attempt: userId=${userId}`);
      return res.status(403).json({
        message: "Account not active. Please contact support.",
      });
    }
    const token = jwt.sign(
      { id: user.user_id, role: user.role },
      process.env.JWT_SECRET
    );

    delete user.password;

    logger.info(`Login successful: userId=${userId}, role=${role}`);
    res.json({
      token,
      user,
    });
  } catch (err) {
    logger.error(`Login error for userId=${userId}: ${err.message}`);
    res.status(500).json({ message: "Server error" });
  }
});

//register a user
router.post("/register", async (req, res) => {
  const {
    stdId: rawStdId,
    name,
    email,
    gender,
    degree,
    dept,
    year,
    section,
    leetcode,
    hackerrank,
    geeksforgeeks,
    codechef,
  } = req.body.formData;
  
  // Normalize student ID
  const cleanedStdId = normalizeUserId(rawStdId);
  
  // Validate student ID
  if (!isValidUserId(cleanedStdId, 'student')) {
    logger.warn(`Invalid student ID format: ${rawStdId}`);
    return res.status(400).json({
      message: "Invalid Student ID format",
    });
  }

  logger.info(`Add student request: ${JSON.stringify(req.body.formData)}`);
  const connection = await db.getConnection(); // Use a connection from the pool

  try {
    await connection.beginTransaction();
    logger.info(
      `Adding student: ${cleanedStdId}, ${name}, ${dept}, ${year}, ${section}, ${email}`
    );

    const hashed = await bcrypt.hash(cleanedStdId, 13);

    // 1. Insert into users table
    const [result] = await connection.query(
      `INSERT INTO users (user_id, email, password, role) VALUES (?,?, ?, ?)`,
      [cleanedStdId, email, hashed, "student"]
    );

    // 2. Insert into student_profiles table
    await connection.query(
      `INSERT INTO student_profiles 
        (student_id, name,degree, dept_code, year, section, gender)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [cleanedStdId, name, degree, dept, year, section, gender]
    );
    await connection.query(
      `INSERT INTO student_performance 
      (student_id) 
      VALUES (?);`,
      [cleanedStdId]
    );
    await connection.query(
      `INSERT INTO student_coding_profiles 
    (student_id, hackerrank_id, leetcode_id, codechef_id, geeksforgeeks_id,
     hackerrank_status, leetcode_status, codechef_status, geeksforgeeks_status,
     hackerrank_verified, leetcode_verified, codechef_verified, geeksforgeeks_verified)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        cleanedStdId,
        hackerrank || null,
        leetcode || null,
        codechef || null,
        geeksforgeeks || null,
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

    logger.info("[EXCEL] Adding student to excel.....");
    const [deptRows] = await connection.query(
      "SELECT dept_name FROM dept WHERE dept_code = ?",
      [dept]
    );
    const dept_name = deptRows.length > 0 ? deptRows[0].dept_name : null;

    await sendNewRegistrationMail(email, name, cleanedStdId, cleanedStdId);

    // After inserting into student_coding_profiles table:
    if (hackerrank) {
      scrapeAndUpdatePerformance(cleanedStdId, "hackerrank", hackerrank);
    }
    if (leetcode) {
      scrapeAndUpdatePerformance(cleanedStdId, "leetcode", leetcode);
    }
    if (codechef) {
      scrapeAndUpdatePerformance(cleanedStdId, "codechef", codechef);
    }
    if (geeksforgeeks) {
      scrapeAndUpdatePerformance(cleanedStdId, "geeksforgeeks", geeksforgeeks);
    }
    // Send email with login details
    await connection.commit();

    logger.info(`Student added successfully: ${cleanedStdId}`);

    res.status(200).json({ message: "Student added successfully" });
  } catch (err) {
    await connection.rollback();
    logger.error(`Error adding student: ${err.message}`);
    res.status(500).json({
      message:
        err.code === "ER_DUP_ENTRY"
          ? `Student with ID ${cleanedStdId} already exists`
          : err.message,
      error: err.errno,
    });
  } finally {
    connection.release();
  }
});

router.get("/validate", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    logger.warn("No authorization header in validate");
    return res.status(401).json({ valid: false });
  }
  try {
    const decoded = jwt.verify(authHeader, process.env.JWT_SECRET);
    const [rows] = await db.query("SELECT * FROM users WHERE user_id = ?", [
      decoded.id,
    ]);
    if (rows.length === 0) {
      logger.warn(`Token valid but user not found: userId=${decoded.id}`);
      return res.status(401).json({ valid: false });
    }

    const user = rows[0];
    delete user.password;

    logger.info(`Token validated for userId=${decoded.id}`);
    res.json({
      valid: true,
      user,
    });
  } catch (err) {
    logger.warn(`Token validation failed: ${err.message}`);
    res.status(401).json({ valid: false });
  }
});

// Reset password
router.post("/reset-password", async (req, res) => {
  const { email, newPassword } = req.body;
  logger.info(`Reset password request for email: ${email}`);
  try {
    // Check if user exists
    const [user] = await db.execute("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (user.length === 0) {
      logger.warn(`Reset password: user not found for email: ${email}`);
      return res.status(400).json({ message: "User not found" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password
    await db.execute("UPDATE users SET password = ? WHERE email = ?", [
      hashedPassword,
      email,
    ]);

    logger.info(`Password reset successfully for email: ${email}`);
    res.json({ message: "Password reset successfully" });
  } catch (error) {
    logger.error(`Reset Password Error for email=${email}: ${error.message}`);
    res.status(500).json({ message: "Server error" });
  }
});

// Update password (authenticated user)
router.put("/update-password", async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.userId; // Assume you have middleware to set req.user
  logger.info(`Update password request for userId: ${userId}`);

  try {
    // Get user by ID
    const [user] = await db.execute("SELECT * FROM users WHERE user_id = ?", [
      userId,
    ]);
    if (user.length === 0) {
      logger.warn(`Update password: user not found for userId: ${userId}`);
      return res.status(400).json({ message: "User not found" });
    }

    // Compare current password
    const isMatch = await bcrypt.compare(currentPassword, user[0].password);
    if (!isMatch) {
      logger.warn(
        `Update password: incorrect current password for userId: ${userId}`
      );
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password
    await db.execute("UPDATE users SET password = ? WHERE user_id = ?", [
      hashedPassword,
      userId,
    ]);

    logger.info(`Password updated successfully for userId: ${userId}`);
    res.json({ message: "Password updated successfully" });
  } catch (error) {
    logger.error(
      `Update Password Error for userId=${userId}: ${error.message}`
    );
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
