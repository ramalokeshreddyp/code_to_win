/**
 * Generate Excel file with student data
 * First sheet contains all students
 * Additional sheets are created for each branch-year-section combination
 */

const ExcelJS = require("exceljs");
const db = require("./config/db");
const path = require("path");
const fs = require("fs");
const { logger } = require("./utils");

async function generateStudentExcel() {
  const workbook = new ExcelJS.Workbook();
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outputDir = path.join(__dirname, "exports");
  const outputPath = path.join(outputDir, `students_${timestamp}.xlsx`);

  // Ensure exports directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  try {
    // Get all student data
    const [studentsData] = await db.query(`
      SELECT 
        sp.student_id, 
        sp.name, 
        sp.gender,
        sp.degree,
        d.dept_name, 
        sp.dept_code, 
        sp.year, 
        sp.section, 
        u.email,
        scp.leetcode_id,
        scp.hackerrank_id,
        scp.codechef_id,
        scp.geeksforgeeks_id,
        scp.github_id,
        perf.stars_hr,
        perf.badgesList_hr,
        perf.repos_gh,
        perf.contributions_gh
      FROM 
        student_profiles sp
      JOIN 
        users u ON sp.student_id = u.user_id
      JOIN 
        dept d ON sp.dept_code = d.dept_code
      LEFT JOIN 
        student_coding_profiles scp ON sp.student_id = scp.student_id
      LEFT JOIN
        student_performance perf ON sp.student_id = perf.student_id
      ORDER BY 
        sp.dept_code, sp.year, sp.section, sp.name
    `);

    // Format data and parse badgesList_hr
    const students = studentsData.map((s) => {
      let badgesStr = "";
      try {
        if (s.badgesList_hr) {
          const badges = JSON.parse(s.badgesList_hr);
          badgesStr = badges.map((b) => `${b.name}: ${b.stars}★`).join(", ");
        }
      } catch (err) {
        logger.error(
          `Error parsing badgesList_hr for ${s.student_id}: ${err.message}`
        );
      }
      return {
        ...s,
        hackerrank_badges: badgesStr,
      };
    });

    logger.info(`Retrieved ${students.length} students from database`);

    // Create main sheet with all students
    const allStudentsSheet = workbook.addWorksheet("All Students");

    // Add headers
    allStudentsSheet.columns = [
      { header: "Student ID", key: "student_id", width: 15 },
      { header: "Name", key: "name", width: 25 },
      { header: "Email", key: "email", width: 30 },
      { header: "Gender", key: "gender", width: 10 },
      { header: "Degree", key: "degree", width: 10 },
      { header: "Department", key: "dept_name", width: 25 },
      { header: "Year", key: "year", width: 8 },
      { header: "Section", key: "section", width: 10 },
      { header: "LeetCode", key: "leetcode_id", width: 20 },
      { header: "HackerRank", key: "hackerrank_id", width: 20 },
      { header: "HackerRank Badges", key: "hackerrank_badges", width: 40 },
      { header: "CodeChef", key: "codechef_id", width: 20 },
      { header: "GeeksForGeeks", key: "geeksforgeeks_id", width: 20 },
      { header: "GitHub ID", key: "github_id", width: 20 },
      { header: "GitHub Repos", key: "repos_gh", width: 15 },
      { header: "GitHub Contribs", key: "contributions_gh", width: 15 },
    ];

    // Add style to header row
    allStudentsSheet.getRow(1).font = { bold: true };
    allStudentsSheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFD3D3D3" },
    };

    // Add all students to main sheet
    allStudentsSheet.addRows(students);

    // Group students by branch-year-section
    const groupedStudents = {};

    students.forEach((student) => {
      const key = `${student.dept_name}-${student.year}-${student.section}`;
      if (!groupedStudents[key]) {
        groupedStudents[key] = [];
      }
      groupedStudents[key].push(student);
    });

    // Create separate sheets for each group
    for (const [key, groupStudents] of Object.entries(groupedStudents)) {
      // Create sheet name (sanitized to be valid Excel sheet name)
      const sheetName = key.replace(/[\\/?*[\]]/g, "-").substring(0, 31);
      const sheet = workbook.addWorksheet(sheetName);

      // Add headers (same as main sheet)
      sheet.columns = allStudentsSheet.columns;

      // Add style to header row
      sheet.getRow(1).font = { bold: true };
      sheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD3D3D3" },
      };

      // Add students to this sheet
      sheet.addRows(groupStudents);

      logger.info(
        `Created sheet for ${key} with ${groupStudents.length} students`
      );
    }

    // Save workbook
    await workbook.xlsx.writeFile(outputPath);
    logger.info(`Excel file generated successfully at ${outputPath}`);
    return outputPath;
  } catch (error) {
    logger.error(`Error generating Excel file: ${error.message}`);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  generateStudentExcel()
    .then((filePath) => {
      console.log(`Excel file generated at: ${filePath}`);
      process.exit(0);
    })
    .catch((err) => {
      console.error("Failed to generate Excel:", err);
      process.exit(1);
    });
}

module.exports = generateStudentExcel;
