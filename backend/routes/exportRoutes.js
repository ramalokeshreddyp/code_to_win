const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const generateStudentExcel = require("../generateStudentExcel");
const { logger } = require("../utils");

// Generate Excel file with student data
router.get("/students-excel", async (req, res) => {
  try {
    logger.info("Excel export requested");
    const filePath = await generateStudentExcel();

    // Get filename from path
    const fileName = path.basename(filePath);

    // Set headers for file download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    logger.info(`Excel file ${fileName} sent to client`);
  } catch (error) {
    logger.error(`Error generating Excel: ${error.message}`);
    res
      .status(500)
      .json({ message: "Failed to generate Excel file", error: error.message });
  }
});

// Get list of available export files
router.get("/files", (req, res) => {
  try {
    const exportsDir = path.join(__dirname, "../exports");

    // Create directory if it doesn't exist
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
      return res.json({ files: [] });
    }

    // Read directory
    const files = fs
      .readdirSync(exportsDir)
      .filter((file) => file.endsWith(".xlsx"))
      .map((file) => ({
        name: file,
        path: `/api/export/download/${file}`,
        created: fs.statSync(path.join(exportsDir, file)).mtime,
      }))
      .sort((a, b) => b.created - a.created);

    res.json({ files });
  } catch (error) {
    logger.error(`Error listing export files: ${error.message}`);
    res
      .status(500)
      .json({ message: "Failed to list export files", error: error.message });
  }
});

// Download a specific export file
router.get("/download/:filename", (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, "../exports", filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "File not found" });
    }

    // Set headers for file download
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    logger.info(`Excel file ${filename} downloaded`);
  } catch (error) {
    logger.error(`Error downloading file: ${error.message}`);
    res
      .status(500)
      .json({ message: "Failed to download file", error: error.message });
  }
});

module.exports = router;
