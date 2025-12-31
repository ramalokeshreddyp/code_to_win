import * as XLSX from "xlsx";

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
