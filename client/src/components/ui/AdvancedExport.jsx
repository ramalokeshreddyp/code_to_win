import React, { useState, useMemo } from "react";
import {
  FiDownload,
  FiCheck,
  FiSquare,
  FiChevronDown,
  FiChevronRight,
} from "react-icons/fi";
import { exportCustomExcel } from "../../utils/excelExport";
import { useMeta } from "../../context/MetaContext";

const STUDENT_FIELD_GROUPS = {
  "Basic Info": [
    { key: "student_id", label: "Roll No" },
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "dept_name", label: "Department" },
    { key: "year", label: "Year" },
    { key: "section", label: "Section" },
    { key: "degree", label: "Degree" },
  ],
  "Academic & Rank": [
    { key: "score", label: "Gamified Score" },
    { key: "overall_rank", label: "University Rank" },
  ],
  Achievements: [
    {
      key: "performance.platformWise.achievements.certifications",
      label: "Certifications",
    },
    {
      key: "performance.platformWise.achievements.hackathon_winners",
      label: "Hackathon Winners",
    },
    {
      key: "performance.platformWise.achievements.hackathon_participation",
      label: "Hackathon Participation",
    },
    {
      key: "performance.platformWise.achievements.workshops",
      label: "Workshops",
    },
  ],
  "Performance Summary": [
    { key: "combined.totalSolved", label: "Total Problems Solved" },
    { key: "combined.totalContests", label: "Total Contests" },
    { key: "combined.last_updated", label: "Last Updated" },
  ],
  LeetCode: [
    { key: "platformWise.leetcode.easy", label: "LC Easy" },
    { key: "platformWise.leetcode.medium", label: "LC Medium" },
    { key: "platformWise.leetcode.hard", label: "LC Hard" },
  ],
  CodeChef: [
    { key: "platformWise.codechef.stars", label: "CC Stars" },
    { key: "platformWise.codechef.problems", label: "CC Problems" },
    { key: "platformWise.codechef.contests", label: "CC Contests" },
  ],
  GeeksForGeeks: [
    { key: "platformWise.gfg.coding_score", label: "GFG Score" },
    { key: "platformWise.gfg.total_problems", label: "GFG Problems" },
    { key: "platformWise.gfg.contests", label: "GFG Contests" },
  ],
  HackerRank: [
    { key: "platformWise.hackerrank.badges", label: "HR Badges Count" },
    { key: "platformWise.hackerrank.badgesList", label: "HR Badges List" },
  ],
  GitHub: [
    { key: "platformWise.github.repos", label: "GH Repos" },
    { key: "platformWise.github.contributions", label: "GH Contributions" },
  ],
};

const FACULTY_FIELD_GROUPS = {
  "Basic Info": [
    { key: "faculty_id", label: "Faculty ID" },
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "dept_code", label: "Department" },
    { key: "assignments", label: "Assignments" },
  ],
};

const HOD_FIELD_GROUPS = {
  "Basic Info": [
    { key: "hod_id", label: "HOD ID" },
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "dept_code", label: "Department" },
  ],
};

const AdvancedExport = ({
  students,
  filenamePrefix = "custom_export",
  onExportFaculty, // Keeping specifically as fallback or alternative if passed
  onExportHOD,
  fetchFacultyData, // New prop to fetch JSON data
  fetchHODData, // New prop to fetch JSON data
}) => {
  const [exportType, setExportType] = useState("students"); // students, faculty, hod
  const [facultyData, setFacultyData] = useState([]);
  const [hodData, setHODData] = useState([]);
  const [loadingMap, setLoadingMap] = useState({ faculty: false, hod: false });

  // Dynamically get current GROUPS based on type
  const activeGroups = useMemo(() => {
    switch (exportType) {
      case "faculty":
        return FACULTY_FIELD_GROUPS;
      case "hod":
        return HOD_FIELD_GROUPS;
      default:
        return STUDENT_FIELD_GROUPS;
    }
  }, [exportType]);

  // Initialize selected fields when type changes
  const [selectedFields, setSelectedFields] = useState(new Set());
  const [expandedGroups, setExpandedGroups] = useState(new Set());

  // Effect to reset selection when type changes
  useMemo(() => {
    const allKeys = Object.values(activeGroups).flatMap((g) =>
      g.map((f) => f.key)
    );
    setSelectedFields(new Set(allKeys));
    setExpandedGroups(new Set(Object.keys(activeGroups)));
  }, [activeGroups]);

  // Fetch data on switch if needed
  const handleTypeChange = async (type) => {
    setExportType(type);
    if (type === "faculty" && facultyData.length === 0 && fetchFacultyData) {
      setLoadingMap((prev) => ({ ...prev, faculty: true }));
      try {
        const data = await fetchFacultyData();
        setFacultyData(data);
      } catch (err) {
        console.error("Failed to fetch faculty data", err);
      }
      setLoadingMap((prev) => ({ ...prev, faculty: false }));
    }
    if (type === "hod" && hodData.length === 0 && fetchHODData) {
      setLoadingMap((prev) => ({ ...prev, hod: true }));
      try {
        const data = await fetchHODData();
        setHODData(data);
      } catch (err) {
        console.error("Failed to fetch HOD data", err);
      }
      setLoadingMap((prev) => ({ ...prev, hod: false }));
    }
  };

  /* New Props: enableStaffExport, onExportFaculty, onExportHOD */
  const { depts: allDepts, years: allYears, sections: allSections } = useMeta();
  const [filters, setFilters] = useState({
    dept: "",
    year: "",
    section: "",
  });

  // Derive available filter options from the provided students list
  const availableDepts = useMemo(() => {
    const codes = [...new Set(students.map((s) => s.dept_code))];
    return allDepts.filter((d) => codes.includes(d.dept_code));
  }, [students, allDepts]);

  const availableYears = useMemo(() => {
    return [...new Set(students.map((s) => s.year?.toString()))]
      .filter(Boolean)
      .sort();
  }, [students]);

  const availableSections = useMemo(() => {
    return [...new Set(students.map((s) => s.section))].filter(Boolean).sort();
  }, [students]);

  /* Data source selection */
  const currentData = useMemo(() => {
    if (exportType === "faculty") return facultyData;
    if (exportType === "hod") return hodData;
    // Default: filtered students
    return students.filter((s) => {
      const matchDept = !filters.dept || s.dept_code === filters.dept;
      const matchYear = !filters.year || s.year?.toString() === filters.year;
      const matchSection = !filters.section || s.section === filters.section;
      return matchDept && matchYear && matchSection;
    });
  }, [exportType, facultyData, hodData, students, filters]);

  const handleExport = () => {
    const fieldsToExport = [];
    Object.values(activeGroups)
      .flat()
      .forEach((field) => {
        if (selectedFields.has(field.key)) {
          fieldsToExport.push(field);
        }
      });

    const prefix =
      exportType === "students"
        ? filenamePrefix
        : `${filenamePrefix.split("_")[0]}_${exportType}`; // e.g. Admin_faculty_export

    exportCustomExcel(currentData, fieldsToExport, prefix);
  };

  /* Helper to toggle fields/groups matching new structure */
  const toggleGroup = (group) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(group)) newExpanded.delete(group);
    else newExpanded.add(group);
    setExpandedGroups(newExpanded);
  };

  const toggleField = (key) => {
    const newSelected = new Set(selectedFields);
    if (newSelected.has(key)) newSelected.delete(key);
    else newSelected.add(key);
    setSelectedFields(newSelected);
  };

  const toggleGroupSelection = (groupName) => {
    const groupFields = activeGroups[groupName].map((f) => f.key);
    const allSelected = groupFields.every((k) => selectedFields.has(k));
    const newSelected = new Set(selectedFields);
    if (allSelected) groupFields.forEach((k) => newSelected.delete(k));
    else groupFields.forEach((k) => newSelected.add(k));
    setSelectedFields(newSelected);
  };

  return (
    <div className="space-y-6">
      {/* Type Selector Tabs */}
      <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
        {["students", "faculty", "hod"].map((type) =>
          type !== "students" && !fetchFacultyData && !fetchHODData ? null : (
            <button
              key={type}
              onClick={() => handleTypeChange(type)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                exportType === type
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {type}
            </button>
          )
        )}
      </div>

      {/* Filters (Only for Students currently) */}
      {exportType === "students" && (
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-4 w-full md:w-auto">
            {availableDepts.length > 1 && (
              <select
                value={filters.dept}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, dept: e.target.value }))
                }
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
              >
                <option value="">All Departments</option>
                {availableDepts.map((d) => (
                  <option key={d.dept_code} value={d.dept_code}>
                    {d.dept_name}
                  </option>
                ))}
              </select>
            )}

            {availableYears.length > 1 && (
              <select
                value={filters.year}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, year: e.target.value }))
                }
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
              >
                <option value="">All Years</option>
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            )}

            {availableSections.length > 1 && (
              <select
                value={filters.section}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, section: e.target.value }))
                }
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
              >
                <option value="">All Sections</option>
                {availableSections.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="text-sm text-gray-500 font-medium">
            Showing {currentData.length} Records
          </div>
        </div>
      )}

      {/* Status Message for other types */}
      {exportType !== "students" && (
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 text-blue-800 text-sm">
          {loadingMap[exportType]
            ? "Fetching data..."
            : `Ready to export ${currentData.length} records.`}
        </div>
      )}

      {/* Main Export Action Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100 gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800">
            Export Configuration
          </h3>
          <p className="text-sm text-gray-500">
            Select fields for {exportType} export
          </p>
        </div>

        <button
          onClick={handleExport}
          disabled={
            selectedFields.size === 0 ||
            currentData.length === 0 ||
            loadingMap[exportType]
          }
          className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-xl shadow-lg hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FiDownload />
          Export {exportType} Data ({selectedFields.size} cols)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(activeGroups).map(([groupName, fields]) => {
          const isExpanded = expandedGroups.has(groupName);
          const groupKeys = fields.map((f) => f.key);
          const isAllSelected = groupKeys.every((k) => selectedFields.has(k));
          const isSomeSelected = groupKeys.some((k) => selectedFields.has(k));

          return (
            <div
              key={groupName}
              className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all"
            >
              {/* Group Header */}
              <div className="flex items-center justify-between p-3 bg-gray-50/50 cursor-pointer border-b border-gray-100">
                <div
                  className="flex items-center gap-2 flex-1"
                  onClick={() => toggleGroup(groupName)}
                >
                  {isExpanded ? <FiChevronDown /> : <FiChevronRight />}
                  <span className="font-semibold text-gray-700">
                    {groupName}
                  </span>
                </div>

                {/* Select All Checkbox for Group */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleGroupSelection(groupName);
                  }}
                  className={`nav-btn p-1 rounded cursor-pointer ${
                    isAllSelected ? "text-blue-600" : "text-gray-400"
                  }`}
                >
                  {isAllSelected ? (
                    <FiCheckSquareIcon />
                  ) : isSomeSelected ? (
                    <FiMinusSquareIcon />
                  ) : (
                    <FiSquareIcon />
                  )}
                </div>
              </div>

              {/* Fields */}
              {isExpanded && (
                <div className="p-3 space-y-2">
                  {fields.map((field) => (
                    <div
                      key={field.key}
                      onClick={() => toggleField(field.key)}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div
                        className={`flex-shrink-0 ${
                          selectedFields.has(field.key)
                            ? "text-blue-600"
                            : "text-gray-300"
                        }`}
                      >
                        {selectedFields.has(field.key) ? (
                          <FiCheckSquareIcon />
                        ) : (
                          <FiSquareIcon />
                        )}
                      </div>
                      <span className="text-sm text-gray-600">
                        {field.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Simple icons for checkbox state
const FiCheckSquareIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
  </svg>
);
const FiSquareIcon = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    strokeWidth="2"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
  </svg>
);
const FiMinusSquareIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm-2 10H7v-2h10v2z" />
  </svg>
);

export default AdvancedExport;
