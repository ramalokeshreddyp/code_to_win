const express = require("express");
const router = express.Router();
const db = require("../config/db");
const { logger } = require("../utils");
const XLSX = require("xlsx");

// GET /download/all-students
router.get("/all-students", async (req, res) => {
  logger.info("Admin downloading all students data");
  try {
    const [students] = await db.query(`
      SELECT sp.*, u.email, d.dept_name,
             p.easy_lc, p.medium_lc, p.hard_lc, p.contests_lc, p.badges_lc,
             p.school_gfg, p.basic_gfg, p.easy_gfg, p.medium_gfg, p.hard_gfg, p.contests_gfg,
             p.problems_cc, p.contests_cc, p.stars_cc, p.badges_cc
      FROM student_profiles sp
      JOIN users u ON sp.student_id = u.user_id
      JOIN dept d ON sp.dept_code = d.dept_code
      LEFT JOIN student_performance p ON sp.student_id = p.student_id
      ORDER BY sp.overall_rank ASC, sp.name ASC
    `);

    const wb = XLSX.utils.book_new();

    // Group students by dept-year-section
    const groups = {};
    students.forEach((s) => {
      const key = `${s.dept_name}-${s.year}-${s.section}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(s);
    });

    // Create sheet for each group
    Object.keys(groups).forEach((groupKey) => {
      const groupData = groups[groupKey].map((s) => ({
        "Student Id": s.student_id,
        "Student Name": s.name,
        Branch: s.dept_name,
        year: s.year,
        Section: s.section,
        Lt_easy: s.easy_lc || 0,
        Lt_med: s.medium_lc || 0,
        Lt_hard: s.hard_lc || 0,
        Lt_Contest: s.contests_lc || 0,
        Lt_badges: s.badges_lc || 0,
        GFG_school: s.school_gfg || 0,
        GFG_basic: s.basic_gfg || 0,
        GFG_easy: s.easy_gfg || 0,
        GFG_med: s.medium_gfg || 0,
        GFG_hard: s.hard_gfg || 0,
        GFG_Contests: s.contests_gfg || 0,
        CC_problems: s.problems_cc || 0,
        CC_Contests: s.contests_cc || 0,
        CC_stars: s.stars_cc || 0,
        CC_badges: s.badges_cc || 0,
        Score: s.score || 0,
      }));
      const ws = XLSX.utils.json_to_sheet(groupData);
      XLSX.utils.book_append_sheet(wb, ws, groupKey.substring(0, 31));
    });

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="all_students_${
        new Date().toISOString().split("T")[0]
      }.xlsx"`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.send(buffer);
  } catch (err) {
    logger.error(`Error downloading all students: ${err.message}`);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /download/faculty
router.get("/faculty", async (req, res) => {
  logger.info("Admin downloading faculty data");
  try {
    const [faculty] = await db.query(`
      SELECT fp.*, u.email, d.dept_name, fsa.year, fsa.section
      FROM faculty_profiles fp
      JOIN users u ON fp.faculty_id = u.user_id
      JOIN dept d ON fp.dept_code = d.dept_code
      LEFT JOIN faculty_section_assignment fsa ON fp.faculty_id = fsa.faculty_id
      ORDER BY d.dept_name, fp.name
    `);

    const wb = XLSX.utils.book_new();

    // All Faculty sheet
    const allFacultyData = faculty.map((f) => ({
      "Faculty ID": f.faculty_id,
      Name: f.name,
      Email: f.email,
      Department: f.dept_name,
      "Assigned Year": f.year || "N/A",
      "Assigned Section": f.section || "N/A",
    }));
    const allWs = XLSX.utils.json_to_sheet(allFacultyData);
    XLSX.utils.book_append_sheet(wb, allWs, "All Faculty");

    // Department-wise sheets
    const deptGroups = {};
    faculty.forEach((f) => {
      if (!deptGroups[f.dept_name]) deptGroups[f.dept_name] = [];
      deptGroups[f.dept_name].push(f);
    });

    Object.keys(deptGroups).forEach((deptName) => {
      const deptData = deptGroups[deptName].map((f) => ({
        "Faculty ID": f.faculty_id,
        Name: f.name,
        Email: f.email,
        "Assigned Year": f.year || "N/A",
        "Assigned Section": f.section || "N/A",
      }));
      const ws = XLSX.utils.json_to_sheet(deptData);
      XLSX.utils.book_append_sheet(wb, ws, deptName.substring(0, 31));
    });

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="faculty_data_${
        new Date().toISOString().split("T")[0]
      }.xlsx"`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.send(buffer);
  } catch (err) {
    logger.error(`Error downloading faculty data: ${err.message}`);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /download/hod
router.get("/hod", async (req, res) => {
  logger.info("Admin downloading HOD data");
  try {
    const [hods] = await db.query(`
      SELECT hp.*, u.email, d.dept_name
      FROM hod_profiles hp
      JOIN users u ON hp.hod_id = u.user_id
      JOIN dept d ON hp.dept_code = d.dept_code
      ORDER BY d.dept_name, hp.name
    `);

    const excelData = hods.map((h) => ({
      "HOD ID": h.hod_id,
      Name: h.name,
      Email: h.email,
      Department: h.dept_name,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    XLSX.utils.book_append_sheet(wb, ws, "HODs");

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="hod_data_${
        new Date().toISOString().split("T")[0]
      }.xlsx"`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.send(buffer);
  } catch (err) {
    logger.error(`Error downloading HOD data: ${err.message}`);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /download/department-wise
router.get("/department-wise", async (req, res) => {
  const { dept } = req.query;
  logger.info(`Admin downloading department-wise data: dept=${dept}`);
  try {
    const wb = XLSX.utils.book_new();

    if (dept) {
      // Stats sheet for selected department
      const [statsData] = await db.query(
        `
        SELECT sp.year, sp.section, COUNT(*) as total
        FROM student_profiles sp
        WHERE sp.dept_code = ?
        GROUP BY sp.year, sp.section
        ORDER BY sp.year, sp.section
      `,
        [dept]
      );

      // Create stats matrix (reversed: sections as rows, years as columns)
      const years = [...new Set(statsData.map((s) => s.year))].sort();
      const sections = [...new Set(statsData.map((s) => s.section))].sort();

      const statsMatrix = [["Section/Year", ...years, "Total"]];

      sections.forEach((section) => {
        const row = [section];
        let sectionTotal = 0;
        years.forEach((year) => {
          const count =
            statsData.find((s) => s.year === year && s.section === section)
              ?.total || 0;
          row.push(count);
          sectionTotal += count;
        });
        row.push(sectionTotal);
        statsMatrix.push(row);
      });

      // Add total row
      const totalRow = ["Total"];
      let grandTotal = 0;
      years.forEach((year) => {
        const yearTotal = statsData
          .filter((s) => s.year === year)
          .reduce((sum, s) => sum + s.total, 0);
        totalRow.push(yearTotal);
        grandTotal += yearTotal;
      });
      totalRow.push(grandTotal);
      statsMatrix.push(totalRow);

      const statsWs = XLSX.utils.aoa_to_sheet(statsMatrix);
      XLSX.utils.book_append_sheet(wb, statsWs, "Department Stats");

      // Create sheets based on year and section combinations
      const [students] = await db.query(
        `
        SELECT sp.student_id, sp.name, u.email, sp.year, sp.section, sp.degree, sp.score, sp.overall_rank
        FROM student_profiles sp
        JOIN users u ON sp.student_id = u.user_id
        WHERE sp.dept_code = ?
        ORDER BY sp.year, sp.section, sp.overall_rank ASC, sp.name ASC
      `,
        [dept]
      );

      // Group students by year and section
      const yearSectionGroups = {};
      students.forEach((s) => {
        const key = `Year ${s.year} Section ${s.section}`;
        if (!yearSectionGroups[key]) yearSectionGroups[key] = [];
        yearSectionGroups[key].push(s);
      });

      // Create sheet for each year-section combination
      Object.keys(yearSectionGroups).forEach((groupKey) => {
        const groupStudents = yearSectionGroups[groupKey].map((s) => ({
          "Student ID": s.student_id,
          Name: s.name,
          Email: s.email,
          Degree: s.degree,
          Score: s.score || 0,
          "University Rank": s.overall_rank || "N/A",
        }));

        const ws = XLSX.utils.json_to_sheet(groupStudents);
        XLSX.utils.book_append_sheet(wb, ws, groupKey.substring(0, 31));
      });
    }

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="department_wise_${dept}_${
        new Date().toISOString().split("T")[0]
      }.xlsx"`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.send(buffer);
  } catch (err) {
    logger.error(`Error downloading department-wise data: ${err.message}`);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /download/custom
router.get("/custom", async (req, res) => {
  const { type, dept, year, section } = req.query;
  logger.info(
    `Admin downloading custom report: type=${type}, dept=${dept}, year=${year}, section=${section}`
  );

  try {
    let query = `
      SELECT sp.student_id, sp.name, u.email, d.dept_name, sp.year, sp.section, sp.degree, 
             sp.score, sp.overall_rank, p.*
      FROM student_profiles sp
      JOIN users u ON sp.student_id = u.user_id
      JOIN dept d ON sp.dept_code = d.dept_code
      LEFT JOIN student_performance p ON sp.student_id = p.student_id
      WHERE 1=1
    `;
    const params = [];

    if (dept) {
      query += " AND sp.dept_code = ?";
      params.push(dept);
    }
    if (year) {
      query += " AND sp.year = ?";
      params.push(year);
    }
    if (section) {
      query += " AND sp.section = ?";
      params.push(section);
    }

    query += " ORDER BY sp.overall_rank ASC, sp.name ASC";

    const [data] = await db.query(query, params);

    const excelData = data.map((d) => ({
      "Student ID": d.student_id,
      Name: d.name,
      Email: d.email,
      Department: d.dept_name,
      Year: d.year,
      Section: d.section,
      Degree: d.degree,
      "LC Easy": d.easy_lc || 0,
      "LC Medium": d.medium_lc || 0,
      "LC Hard": d.hard_lc || 0,
      "GFG School": d.school_gfg || 0,
      "GFG Basic": d.basic_gfg || 0,
      "GFG Easy": d.easy_gfg || 0,
      "GFG Medium": d.medium_gfg || 0,
      "GFG Hard": d.hard_gfg || 0,
      "CC Problems": d.problems_cc || 0,
      "Total Problems":
        (d.easy_lc || 0) +
        (d.medium_lc || 0) +
        (d.hard_lc || 0) +
        (d.school_gfg || 0) +
        (d.basic_gfg || 0) +
        (d.easy_gfg || 0) +
        (d.medium_gfg || 0) +
        (d.hard_gfg || 0) +
        (d.problems_cc || 0),
      Score: d.score || 0,
      "University Rank": d.overall_rank || "N/A",
      "Last Updated": d.last_updated || "N/A",
    }));

    console.log("Final check", data);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    XLSX.utils.book_append_sheet(wb, ws, "Custom Report");

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    const filename = `custom_report_${dept || "all"}_${year || "all"}_${
      section || "all"
    }_${new Date().toISOString().split("T")[0]}.xlsx`;
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.send(buffer);
  } catch (err) {
    logger.error(`Error downloading custom report: ${err.message}`);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
