const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { logger } = require("../utils");

// GET /meta/grading
router.get("/grading", async (req, res) => {
  logger.info("Fetching grading system");
  try {
    // Fetch grading system
    const [grading] = await db.query("SELECT * FROM grading_system");
    logger.info("Fetched grading system");
    res.json({ grading });
  } catch (err) {
    logger.error(`Error fetching grading system: ${err.message}`);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /meta/grading/:metric
router.put("/grading/:metric", async (req, res) => {
  const { metric } = req.params;
  const { points } = req.body;
  logger.info(`Updating grading points: metric=${metric}, points=${points}`);
  try {
    await db.query("UPDATE grading_system SET points = ? WHERE metric = ?", [
      points,
      metric,
    ]);
    logger.info(`Grading points updated for metric=${metric}`);
    res.json({ message: "Grading points updated successfully" });
  } catch (err) {
    logger.error(
      `Error updating grading points for metric=${metric}: ${err.message}`
    );
    res.status(500).json({ message: "Server error" });
  }
});

// GET /meta/depts
router.get("/depts", async (req, res) => {
  logger.info("Fetching departments");
  try {
    const [depts] = await db.query("SELECT * FROM dept");
    logger.info(`Fetched ${depts.length} departments`);
    res.json(depts);
  } catch (err) {
    logger.error(`Error fetching departments: ${err.message}`);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /meta/years
router.get("/years", async (req, res) => {
  logger.info("Fetching years");
  try {
    // Keep year filters consistent across all modules.
    res.json([1, 2, 3, 4]);
  } catch (err) {
    logger.error(`Error fetching years: ${err.message}`);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /meta/sections?dept=CSE&year=1
router.get("/sections", async (req, res) => {
  const { dept, year } = req.query;
  logger.info(`Fetching sections: dept=${dept}, year=${year}`);
  try {
    if (dept && year) {
      const currentYear = new Date().getFullYear();
      const batch = currentYear - (parseInt(year) - 1);

      const [rows] = await db.query(
        "SELECT num_sections FROM dept_batch_configs WHERE dept_code = ? AND batch = ?",
        [dept, batch]
      );

      if (rows.length > 0) {
        const num = rows[0].num_sections;
        const sectionList = Array.from({ length: num }, (_, i) =>
          (i + 1).toString()
        );
        return res.json(sectionList);
      }
    }

    // Fallback to existing logic or empty if no specific config found
    const [sections] = await db.query(
      "SELECT DISTINCT section FROM faculty_section_assignment ORDER BY section"
    );
    res.json(sections.map((s) => s.section));
  } catch (err) {
    logger.error(`Error fetching sections: ${err.message}`);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
