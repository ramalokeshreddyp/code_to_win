import * as XLSX from "xlsx";
import { formatName, formatDepartment, formatSection } from "./textFormatter";

const toSafeNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const applyAutoColumns = (worksheet, rows, minWidth = 12, maxWidth = 45) => {
  const firstRow = rows?.[0] || {};
  const keys = Object.keys(firstRow);
  worksheet["!cols"] = keys.map((key) => {
    const maxLength = Math.max(
      String(key).length,
      ...rows.map((row) => String(row[key] ?? "").length)
    );
    return { wch: Math.min(Math.max(maxLength + 2, minWidth), maxWidth) };
  });
};

const withFilterRows = (sheetRows, filterDetails = {}) => {
  const headerRows = [
    { Metric: "Department", Value: filterDetails.dept || "Overall" },
    { Metric: "Year", Value: filterDetails.year || "Overall" },
    { Metric: "Section", Value: filterDetails.section || "Overall" },
    { Metric: "Degree", Value: filterDetails.degree || "Overall" },
    { Metric: "Generated At", Value: new Date().toLocaleString("en-GB") },
    { Metric: "", Value: "" },
  ];

  return [...headerRows, ...sheetRows];
};

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
    Name: formatName(student.name),
    Department: formatDepartment(student.dept_name),
    Year: student.year,
    Section: formatSection(student.section),
    Degree: student.degree,
    Score: student.score || 0,
    "University Rank": student.overall_rank || "N/A",
    "Total Problems": student.performance?.combined?.totalSolved || 0,
    "Total Contests": student.performance?.combined?.totalContests || 0,
    "HackerRank Badges": Number(student.performance?.platformWise?.hackerrank?.badges || 0),
    "HackerRank Stars": Number(student.performance?.platformWise?.hackerrank?.totalStars || 0),
    "HackerRank Details": (
      student.performance?.platformWise?.hackerrank?.badgesList || []
    )
      .map((b) => `${b.name}: ${Number(b.stars || 0)} Stars`)
      .join(", ") || "No badges",
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

export const exportPlatformStatisticsToExcel = (
  stats,
  filters,
  filenamePrefix = "platform_statistics"
) => {
  const workbook = XLSX.utils.book_new();

  const leetcodeRows = withFilterRows(
    [
      { Metric: "Total Problems", Value: toSafeNumber(stats?.leetcode?.totalProblemsSolved) },
      { Metric: "Easy", Value: toSafeNumber(stats?.leetcode?.totalEasyProblems) },
      { Metric: "Medium", Value: toSafeNumber(stats?.leetcode?.totalMediumProblems) },
      { Metric: "Hard", Value: toSafeNumber(stats?.leetcode?.totalHardProblems) },
      { Metric: "Total Contests", Value: toSafeNumber(stats?.leetcode?.totalContestsAttended) },
    ],
    filters
  );

  const gfgRows = withFilterRows(
    [
      { Metric: "Total Problems", Value: toSafeNumber(stats?.gfg?.totalProblemsSolved) },
      { Metric: "School", Value: toSafeNumber(stats?.gfg?.totalSchool) },
      { Metric: "Basic", Value: toSafeNumber(stats?.gfg?.totalBasic) },
      { Metric: "Easy", Value: toSafeNumber(stats?.gfg?.totalEasy) },
      { Metric: "Medium", Value: toSafeNumber(stats?.gfg?.totalMedium) },
      { Metric: "Hard", Value: toSafeNumber(stats?.gfg?.totalHard) },
      { Metric: "Total Contests", Value: toSafeNumber(stats?.gfg?.totalContests) },
    ],
    filters
  );

  const codechefRows = withFilterRows(
    [
      { Metric: "Total Problems", Value: toSafeNumber(stats?.codechef?.totalProblemsSolved) },
      { Metric: "Total Contests", Value: toSafeNumber(stats?.codechef?.totalContestsWritten) },
    ],
    filters
  );

  const preferredBadges = ["C", "C++", "Java", "Python", "SQL", "Problem Solving"];
  const badgeDistribution = Array.isArray(stats?.hackerrank?.badgeDistribution)
    ? stats.hackerrank.badgeDistribution
    : [];
  const badgeMap = new Map(
    badgeDistribution.map((item) => [String(item.badge || "").trim(), toSafeNumber(item.students)])
  );
  const hackerrankRows = withFilterRows(
    [
      { Metric: "Total Badges", Value: toSafeNumber(stats?.hackerrank?.totalBadges) },
      ...preferredBadges.map((badge) => ({ Metric: badge, Value: badgeMap.get(badge) || 0 })),
      ...badgeDistribution
        .filter((item) => !preferredBadges.includes(String(item.badge || "").trim()))
        .map((item) => ({
          Metric: String(item.badge || "Other"),
          Value: toSafeNumber(item.students),
        })),
    ],
    filters
  );

  const overallSummaryRows = withFilterRows(
    [
      { Metric: "Total Students", Value: toSafeNumber(stats?.overview?.totalStudents) },
      { Metric: "LeetCode Active", Value: toSafeNumber(stats?.overview?.activeLeetCodeStudents) },
      { Metric: "GFG Active", Value: toSafeNumber(stats?.overview?.activeGFGStudents) },
      { Metric: "CodeChef Active", Value: toSafeNumber(stats?.overview?.activeCodeChefStudents) },
      { Metric: "HackerRank Active", Value: toSafeNumber(stats?.overview?.activeHackerRankStudents) },
      { Metric: "GitHub Active", Value: toSafeNumber(stats?.overview?.activeGitHubStudents) },
    ],
    filters
  );

  const leetcodeSheet = XLSX.utils.json_to_sheet(leetcodeRows);
  const gfgSheet = XLSX.utils.json_to_sheet(gfgRows);
  const codechefSheet = XLSX.utils.json_to_sheet(codechefRows);
  const hackerrankSheet = XLSX.utils.json_to_sheet(hackerrankRows);
  const overallSummarySheet = XLSX.utils.json_to_sheet(overallSummaryRows);

  applyAutoColumns(leetcodeSheet, leetcodeRows);
  applyAutoColumns(gfgSheet, gfgRows);
  applyAutoColumns(codechefSheet, codechefRows);
  applyAutoColumns(hackerrankSheet, hackerrankRows);
  applyAutoColumns(overallSummarySheet, overallSummaryRows);

  XLSX.utils.book_append_sheet(workbook, leetcodeSheet, "LeetCode");
  XLSX.utils.book_append_sheet(workbook, gfgSheet, "GeeksforGeeks");
  XLSX.utils.book_append_sheet(workbook, codechefSheet, "CodeChef");
  XLSX.utils.book_append_sheet(workbook, hackerrankSheet, "HackerRank");
  XLSX.utils.book_append_sheet(workbook, overallSummarySheet, "Overall Summary");

  const timestamp = new Date().toISOString().split("T")[0];
  XLSX.writeFile(workbook, `${filenamePrefix}_${timestamp}.xlsx`);
};

export const exportWeeklyProgressToExcel = (
  weeklyData,
  filenamePrefix = "weekly_progress_report"
) => {
  const workbook = XLSX.utils.book_new();

  const filters = weeklyData?.filters || {};
  const range = weeklyData?.weekRange || {};
  const summary = weeklyData?.summary || {};

  const summaryRows = withFilterRows(
    [
      {
        Metric: "Week Range (This Week)",
        Value: `${range.thisWeekStart || "-"} to ${range.thisWeekEnd || "-"}`,
      },
      {
        Metric: "Week Range (Last Week)",
        Value: `${range.lastWeekStart || "-"} to ${range.lastWeekEnd || "-"}`,
      },
      {
        Metric: "Students In Scope",
        Value: toSafeNumber(summary.totalStudentsInScope),
      },
      {
        Metric: "Students Active This Week",
        Value: toSafeNumber(summary.totalStudentsActiveThisWeek),
      },
      {
        Metric: "Total Problems Added This Week",
        Value: toSafeNumber(summary.totalProblemsAddedThisWeek),
      },
      {
        Metric: "Total Contests Added This Week",
        Value: toSafeNumber(summary.totalContestsAddedThisWeek),
      },
      { Metric: "Students Improved", Value: toSafeNumber(summary.studentsImproved) },
      { Metric: "Students Declined", Value: toSafeNumber(summary.studentsDeclined) },
      { Metric: "Students Unchanged", Value: toSafeNumber(summary.studentsUnchanged) },
    ],
    filters
  );

  const comparisonRows = [
    {
      Platform: "Platform",
      "Last Week": "Last Week",
      "This Week": "This Week",
      Growth: "Growth",
    },
    ...((weeklyData?.platformComparison || []).map((row) => ({
      Platform: row.platform,
      "Last Week": toSafeNumber(row.lastWeek),
      "This Week": toSafeNumber(row.thisWeek),
      Growth: toSafeNumber(row.growth),
    }))),
  ];

  const studentRows = [
    {
      "Student ID": "Student ID",
      Department: "Department",
      Year: "Year",
      Section: "Section",
      Degree: "Degree",
      "Previous Total Problems": "Previous Total Problems",
      "Current Total Problems": "Current Total Problems",
      "Problems Δ": "Problems Δ",
      "LeetCode Δ": "LeetCode Δ",
      "GFG Δ": "GFG Δ",
      "CodeChef Δ": "CodeChef Δ",
      "HackerRank Δ": "HackerRank Δ",
      "Contests Δ": "Contests Δ",
    },
    ...((weeklyData?.studentActivity || []).map((row) => ({
      "Student ID": row.studentId,
      Department: row.deptCode,
      Year: row.year,
      Section: row.section,
      Degree: row.degree,
      "Previous Total Problems": toSafeNumber(row.previousTotalProblems),
      "Current Total Problems": toSafeNumber(row.currentTotalProblems),
      "Problems Δ": toSafeNumber(row.totalProblemsDelta),
      "LeetCode Δ": toSafeNumber(row.leetcodeDelta),
      "GFG Δ": toSafeNumber(row.gfgDelta),
      "CodeChef Δ": toSafeNumber(row.codechefDelta),
      "HackerRank Δ": toSafeNumber(row.hackerrankDelta),
      "Contests Δ": toSafeNumber(row.contestsDelta),
    }))),
  ];

  const contestComparisonRows = [
    {
      Platform: "Platform",
      "Last Week": "Last Week",
      "This Week": "This Week",
      Growth: "Growth",
    },
    ...((weeklyData?.platformContestComparison || []).map((row) => ({
      Platform: row.platform,
      "Last Week": toSafeNumber(row.lastWeek),
      "This Week": toSafeNumber(row.thisWeek),
      Growth: toSafeNumber(row.growth),
    }))),
  ];

  const topPerformersRows = [
    {
      Rank: "Rank",
      "Student ID": "Student ID",
      Department: "Department",
      Year: "Year",
      Section: "Section",
      Degree: "Degree",
      "Problems Δ": "Problems Δ",
      "Contests Δ": "Contests Δ",
      "Badges Δ": "Badges Δ",
      "Activity Score": "Activity Score",
    },
    ...((weeklyData?.topPerformers || []).map((row, index) => ({
      Rank: index + 1,
      "Student ID": row.studentId,
      Department: row.deptCode,
      Year: row.year,
      Section: row.section,
      Degree: row.degree,
      "Problems Δ": toSafeNumber(row.problemsDelta),
      "Contests Δ": toSafeNumber(row.contestsDelta),
      "Badges Δ": toSafeNumber(row.hackerrankDelta),
      "Activity Score": toSafeNumber(row.activityIncrease),
    }))),
  ];

  const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
  const comparisonSheet = XLSX.utils.json_to_sheet(comparisonRows, { skipHeader: true });
  const contestComparisonSheet = XLSX.utils.json_to_sheet(contestComparisonRows, { skipHeader: true });
  const studentsSheet = XLSX.utils.json_to_sheet(studentRows, { skipHeader: true });
  const topPerformersSheet = XLSX.utils.json_to_sheet(topPerformersRows, { skipHeader: true });

  applyAutoColumns(summarySheet, summaryRows);
  applyAutoColumns(comparisonSheet, comparisonRows);
  applyAutoColumns(contestComparisonSheet, contestComparisonRows);
  applyAutoColumns(studentsSheet, studentRows);
  applyAutoColumns(topPerformersSheet, topPerformersRows);

  XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");
  XLSX.utils.book_append_sheet(workbook, comparisonSheet, "Platform Growth");
  XLSX.utils.book_append_sheet(workbook, contestComparisonSheet, "Contest Growth");
  XLSX.utils.book_append_sheet(workbook, topPerformersSheet, "Top Performers");
  XLSX.utils.book_append_sheet(workbook, studentsSheet, "Student Breakdown");

  const timestamp = new Date().toISOString().split("T")[0];
  XLSX.writeFile(workbook, `${filenamePrefix}_${timestamp}.xlsx`);
};
