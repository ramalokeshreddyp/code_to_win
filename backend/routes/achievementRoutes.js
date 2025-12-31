const express = require("express");
const router = express.Router();
const db = require("../config/db");
const upload = require("../middleware/uploadMiddleware");
const { logger } = require("../utils");
const updateAllRankings = require("../updateRankings");

// POST /api/achievements/add - Student uploads an achievement
router.post("/add", upload.single("file"), async (req, res) => {
  const { studentId, type, title, orgName, date, description } = req.body;
  const filePath = req.file
    ? `/uploads/certificates/${req.file.filename}`
    : null;

  logger.info(`Adding achievement for studentId=${studentId}, type=${type}`);

  try {
    // Basic Validation
    if (!studentId || !type || !title || !orgName || !date) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Check limit (optional: max 5 achievements total check could go here)
    const [[{ count }]] = await db.query(
      "SELECT COUNT(*) as count FROM student_achievements WHERE student_id = ?",
      [studentId]
    );

    if (count >= 5) {
      return res.status(400).json({
        message:
          "Maximum of 5 achievements allowed. Please delete one to add new.",
      });
    }

    await db.query(
      `INSERT INTO student_achievements (student_id, type, subtype, title, org_name, date, description, file_path, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        studentId,
        type,
        req.body.subtype || null,
        title,
        orgName,
        date,
        description,
        filePath,
      ]
    );

    logger.info(`Achievement added successfully for studentId=${studentId}`);
    res.json({ message: "Achievement submitted for approval" });
  } catch (err) {
    logger.error(`Error adding achievement: ${err.message}`);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/achievements/my-achievements - Get achievements for a student
router.get("/my-achievements", async (req, res) => {
  const { studentId } = req.query;
  try {
    const [rows] = await db.query(
      "SELECT * FROM student_achievements WHERE student_id = ? ORDER BY created_at DESC",
      [studentId]
    );
    res.json(rows);
  } catch (err) {
    logger.error(
      `Error fetching achievements for student ${studentId}: ${err.message}`
    );
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/achievements/:id - Student deletes an achievement
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  const { studentId } = req.query; // Ensure ownership

  logger.info(`Deleting achievement ${id} by student ${studentId}`);

  try {
    // Verify ownership
    const [rows] = await db.query(
      "SELECT * FROM student_achievements WHERE id = ? AND student_id = ?",
      [id, studentId]
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Achievement not found or unauthorized" });
    }

    const ach = rows[0];

    // If it was previously approved, we need to revert points?
    // Usually if a student deletes an approved achievement, they lose points.
    if (ach.status === "approved") {
      // Decrease count in performance
      let countColumn = "";
      if (ach.type === "certification") countColumn = "certification_count";
      else if (ach.type === "hackathon") countColumn = "hackathon_count";
      else if (ach.type === "workshop") countColumn = "workshop_count";

      if (countColumn) {
        await db.query(
          `UPDATE student_performance SET ${countColumn} = GREATEST(${countColumn} - 1, 0) WHERE student_id = ?`,
          [studentId]
        );
      }
    }

    // Delete DB Record
    await db.query("DELETE FROM student_achievements WHERE id = ?", [id]);

    // Delete File (Optional, but good practice)
    // const fs = require('fs');
    // const path = require('path');
    // if(ach.file_path) { ... }

    res.json({ message: "Achievement deleted successfully" });
  } catch (err) {
    logger.error(`Error deleting achievement ${id}: ${err.message}`);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/achievements/pending - Faculty sees pending requests
// Filtered by Faculty's assigned sections
router.get("/pending", async (req, res) => {
  const { facultyId } = req.query;

  if (!facultyId)
    return res.status(400).json({ message: "Faculty ID required" });

  try {
    // 1. Get Faculty Dept
    const [faculty] = await db.query(
      "SELECT dept_code FROM faculty_profiles WHERE faculty_id = ?",
      [facultyId]
    );

    if (faculty.length === 0)
      return res.status(404).json({ message: "Faculty not found" });

    const deptCode = faculty[0].dept_code;

    // 2. Get Faculty Assignments (Year & Section)
    const [assignments] = await db.query(
      "SELECT year, section FROM faculty_section_assignment WHERE faculty_id = ?",
      [facultyId]
    );

    if (assignments.length === 0) {
      // No students assigned
      return res.json([]);
    }

    // 3. Build Dynamic Query based on assignments
    // We want: (year = y1 AND section = s1) OR (year = y2 AND section = s2) ...
    const conditions = assignments
      .map(() => "(sp.year = ? AND sp.section = ?)")
      .join(" OR ");

    // Flatten params: [y1, s1, y2, s2, ...]
    const assignmentParams = assignments.flatMap((a) => [a.year, a.section]);

    const query = `
            SELECT sa.*, sp.name as student_name, sp.student_id as roll_number, sp.year, sp.section, sp.dept_code 
            FROM student_achievements sa
            JOIN student_profiles sp ON sa.student_id = sp.student_id
            WHERE sa.status = 'pending'
            AND sp.dept_code = ?
            AND (${conditions})
            ORDER BY sa.date DESC
         `;

    const [rows] = await db.query(query, [deptCode, ...assignmentParams]);

    res.json(rows);
  } catch (err) {
    logger.error(`Error fetching pending achievements: ${err.message}`);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/achievements/:id/action - Approve or Reject
router.post("/:id/action", async (req, res) => {
  const { id } = req.params;
  const { action, facultyId, rejectionReason } = req.body; // action: 'approve' | 'reject'

  logger.info(`Faculty ${facultyId} performing ${action} on achievement ${id}`);

  try {
    const [rows] = await db.query(
      "SELECT * FROM student_achievements WHERE id = ?",
      [id]
    );
    if (rows.length === 0)
      return res.status(404).json({ message: "Achievement not found" });
    const achievement = rows[0];

    if (achievement.status !== "pending") {
      return res.status(400).json({ message: "Achievement is not pending" });
    }

    if (action === "approve") {
      // 1. Get points from grading_system
      let metricKey = "";
      if (achievement.type === "certification")
        metricKey = "certification_count";
      else if (achievement.type === "hackathon") {
        // Check subtype
        metricKey =
          achievement.subtype === "winner"
            ? "hackathon_winner_count"
            : "hackathon_participation_count";
      } else if (achievement.type === "workshop") metricKey = "workshop_count";

      const [grading] = await db.query(
        "SELECT points FROM grading_system WHERE metric = ?",
        [metricKey]
      );
      const pointsToAdd = grading.length > 0 ? grading[0].points : 0;

      // 2. Update Student Performance (increment count)
      // We only increment the count. The Ranking calculation multiplies count * points dynamically.
      // But we also store points_awarded in the achievement row for history.

      const updatePerfQuery = `UPDATE student_performance SET ${metricKey} = ${metricKey} + 1 WHERE student_id = ?`;
      await db.query(updatePerfQuery, [achievement.student_id]);

      // 3. Update Achievement Status
      await db.query(
        "UPDATE student_achievements SET status = 'approved', approved_by = ?, points_awarded = ? WHERE id = ?",
        [facultyId, pointsToAdd, id]
      );

      // 4. Trigger Score Recalculation
      // Since score depends on lookup of grading system * count, we need to re-run rankings
      // or at least for this student. For simplicity and correctness, we trigger the ranking update.
      // This might be heavy if many approvals happen, but ensures "sync everywhere".
      try {
        await updateAllRankings();
        logger.info(
          `Rankings updated after achievement approval for student ${achievement.student_id}`
        );
      } catch (rankErr) {
        logger.error(
          `Failed to update rankings after approval: ${rankErr.message}`
        );
      }
    } else if (action === "reject") {
      if (!rejectionReason)
        return res.status(400).json({ message: "Rejection reason required" });

      await db.query(
        "UPDATE student_achievements SET status = 'rejected', approved_by = ?, rejection_reason = ? WHERE id = ?",
        [facultyId, rejectionReason, id]
      );
    } else {
      return res.status(400).json({ message: "Invalid action" });
    }

    res.json({ message: `Achievement ${action}d successfully` });
  } catch (err) {
    logger.error(
      `Error processing action on achievement ${id}: ${err.message}`
    );
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
