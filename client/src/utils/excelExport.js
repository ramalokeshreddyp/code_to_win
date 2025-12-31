import * as XLSX from "xlsx";

// Helper to access nested properties safely
const getNestedValue = (obj, path) => {
  return path
    .split(".")
    .reduce(
      (acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined),
      obj
    );
};

export const exportStudentsToExcel = (students, filename = "students") => {
  // Prepare data for Excel export
  const excelData = students.map((student, i) => ({
    "S.No": i + 1,
    "Student ID": student.student_id,
    Name: student.name,
    Department: student.dept_name,
    Year: student.year,
    Section: student.section,
    Degree: student.degree,
    Score: student.score || 0,
    "University Rank": student.overall_rank || "N/A",
    "Total Problems": student.performance?.combined?.totalSolved || 0,
    "Total Contests": student.performance?.combined?.totalContests || 0,
    "HackerRank Badges": (
      student.performance?.platformWise?.hackerrank?.badgesList || []
    )
      .map((b) => `${b.name}: ${b.stars}★`)
      .join(", "),
    "GitHub Repos": student.performance?.platformWise?.github?.repos || 0,
    "GitHub Contribs":
      student.performance?.platformWise?.github?.contributions || 0,
    "Last Updated": student.performance?.combined?.last_updated || "N/A",
  }));

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(excelData);

  // Auto-size columns
  const colWidths = [];
  Object.keys(excelData[0] || {}).forEach((key, i) => {
    const maxLength = Math.max(
      key.length,
      ...excelData.map((row) => String(row[key] || "").length)
    );
    colWidths[i] = { wch: Math.min(maxLength + 2, 30) };
  });
  ws["!cols"] = colWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, "Students");

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().split("T")[0];
  const finalFilename = `${filename}_${timestamp}.xlsx`;

  // Save file
  XLSX.writeFile(wb, finalFilename);
};

export const exportCustomExcel = (
  data, // Array of students OR Object { sheetName: students[] }
  fieldsConfig,
  filenamePrefix = "custom_export"
) => {
  const wb = XLSX.utils.book_new();

  const isMultiSheet = !Array.isArray(data);
  const sheetsMap = isMultiSheet ? data : { "Custom Export": data };

  Object.entries(sheetsMap).forEach(([sheetName, students]) => {
    // Skip empty data for sheets if multi-sheet
    if (isMultiSheet && (!students || students.length === 0)) return;

    const excelData = students.map((student, i) => {
      const row = { "S.No": i + 1 };

      fieldsConfig.forEach((field) => {
        let value = getNestedValue(student, field.key);

        if (value === undefined && student.performance) {
          value = getNestedValue(student.performance, field.key);
        }

        if (field.key.includes("badgesList") && Array.isArray(value)) {
          value = value.map((b) => `${b.name}: ${b.stars}★`).join(", ");
        }

        row[field.label] = value !== undefined && value !== null ? value : "-";
      });

      return row;
    });

    const ws = XLSX.utils.json_to_sheet(excelData);

    // Auto-size columns
    const colWidths = [{ wch: 5 }]; // S.No
    fieldsConfig.forEach((field) => {
      const key = field.label;
      const maxLength = Math.max(
        key.length,
        ...excelData.map((row) => String(row[key] || "").length)
      );
      colWidths.push({ wch: Math.min(maxLength + 2, 40) });
    });
    ws["!cols"] = colWidths;

    // Sheet name must be <= 31 chars and unique
    const safeSheetName = sheetName.substring(0, 31);
    XLSX.utils.book_append_sheet(wb, ws, safeSheetName);
  });

  const timestamp = new Date().toISOString().split("T")[0];
  XLSX.writeFile(wb, `${filenamePrefix}_${timestamp}.xlsx`);
};
