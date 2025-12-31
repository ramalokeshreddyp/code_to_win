import React, { useEffect, useState, lazy, Suspense } from "react";
import { FaSearch } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/Navbar";
import axios from "axios";
import LoadingSpinner from "../../common/LoadingSpinner";
import {
  AddFacultyModal,
  AddIndividualStudentModel,
  BulkImportModal,
  DeleteIndividualStudentModal,
  ResetPasswordModal,
} from "../../components/Modals";
import { useMeta } from "../../context/MetaContext";
import Footer from "../../components/Footer";
import DashboardSidebar from "../../components/DashboardSidebar";
import StatsCard from "../../components/ui/StatsCard";
import { exportStudentsToExcel } from "../../utils/excelExport";
import dayjs from "dayjs";
import {
  FiBarChart2,
  FiUsers,
  FiUserPlus,
  FiDownload,
  FiClock,
  FiHome,
  FiLayers,
  FiGrid,
} from "react-icons/fi";

// Lazy-loaded components
const RankingTable = lazy(() => import("../../components/Ranking"));
const ViewProfile = lazy(() => import("../../components/ViewProfile"));
const StudentTable = lazy(() => import("../../components/ui/StudentTable"));

// Student Management Tab Component
function StudentManagementTab({
  years,
  sections,
  filterYear,
  setFilterYear,
  filterSection,
  setFilterSection,
  search,
  setSearch,
  filteredStudents,
  setSelectedStudent,
  currentUser,
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            Student Management
          </h2>
          <p className="text-gray-500 text-sm">
            Manage student records and view details
          </p>
        </div>
        <button
          onClick={() =>
            exportStudentsToExcel(
              filteredStudents,
              `hod_students_${currentUser?.dept_code}`
            )
          }
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition shadow-sm"
        >
          <FiDownload />
          Export Excel
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6 items-end justify-between">
        <div className="flex gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Year
            </label>
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
            >
              <option value="">All Years</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              Section
            </label>
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={filterSection}
              onChange={(e) => setFilterSection(e.target.value)}
            >
              <option value="">All Sections</option>
              {sections.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="relative w-full md:w-64">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 text-sm"
          />
        </div>
      </div>

      <Suspense fallback={<LoadingSpinner />}>
        <div className="overflow-x-auto rounded-xl border border-gray-100">
          <StudentTable
            students={filteredStudents}
            showBranch={true}
            showYear={true}
            showSection={true}
            rankLabel="Rank"
            onProfileClick={setSelectedStudent}
          />
        </div>
      </Suspense>
    </div>
  );
}

// Faculty Management Tab Component
function FacultyManagementTab({
  years,
  sections,
  facultyList,
  refreshFacultyList,
}) {
  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [assignments, setAssignments] = useState([{ year: "", section: "" }]);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAddAssignment = () => {
    setAssignments([...assignments, { year: "", section: "" }]);
  };

  const handleRemoveAssignment = (index) => {
    if (assignments.length > 1) {
      setAssignments(assignments.filter((_, i) => i !== index));
    }
  };

  const handleAssignmentChange = (index, field, value) => {
    const newAssignments = [...assignments];
    newAssignments[index][field] = value;
    setAssignments(newAssignments);
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (!selectedFaculty) {
      setMessage({ type: "error", text: "Please select a faculty member." });
      return;
    }

    // Validate all assignments
    for (const assignment of assignments) {
      if (!assignment.year || !assignment.section) {
        setMessage({
          type: "error",
          text: "All year and section fields are required.",
        });
        return;
      }
    }

    // Check for duplicates
    const assignmentKeys = assignments.map((a) => `${a.year}-${a.section}`);
    const uniqueKeys = new Set(assignmentKeys);
    if (assignmentKeys.length !== uniqueKeys.size) {
      setMessage({
        type: "error",
        text: "Duplicate year-section combinations are not allowed.",
      });
      return;
    }

    setLoading(true);
    try {
      await axios.post("/api/hod/assign-faculty", {
        faculty_id: selectedFaculty,
        dept_code: facultyList.find((f) => f.faculty_id === selectedFaculty)
          ?.dept_code,
        assignments: assignments,
      });
      setMessage({
        type: "success",
        text: `Successfully assigned ${assignments.length} section(s)!`,
      });

      if (refreshFacultyList) {
        refreshFacultyList();
      }

      setTimeout(() => {
        setSelectedFaculty("");
        setAssignments([{ year: "", section: "" }]);
      }, 1500);
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err.response?.data?.message ||
          "Failed to assign sections. Please try again.",
      });
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6">
      <div className="w-full xl:w-1/2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Faculty Overview
        </h2>
        <div className="space-y-4 h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {facultyList.map((faculty, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-gray-100 bg-gray-50 hover:border-blue-200 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="font-bold text-gray-900">{faculty.name}</div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">
                    Assignments
                  </div>
                </div>
                <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 font-medium">
                  Active
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {faculty.assignments && faculty.assignments.length > 0 ? (
                  faculty.assignments.map((assignment, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-white text-blue-700 border border-blue-100 shadow-sm"
                    >
                      Year {assignment.year} - Sec {assignment.section}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-400 italic">
                    No active assignments
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full xl:w-1/2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-1">
          Assign Sections
        </h2>
        <p className="text-gray-500 text-sm mb-6">
          Manage teaching assignments for faculty members
        </p>

        <form className="space-y-6" onSubmit={handleAssign}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Faculty Member
            </label>
            <select
              className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              value={selectedFaculty}
              onChange={(e) => setSelectedFaculty(e.target.value)}
            >
              <option value="">Choose faculty...</option>
              {facultyList.map((faculty, idx) => (
                <option key={idx} value={faculty.faculty_id}>
                  {faculty.name}
                </option>
              ))}
            </select>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Class Assignments
              </label>
              <button
                type="button"
                onClick={handleAddAssignment}
                className="text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-medium hover:bg-blue-100 transition"
              >
                + Add Another
              </button>
            </div>

            <div className="space-y-3">
              {assignments.map((assignment, index) => (
                <div key={index} className="flex gap-3 items-center">
                  <div className="flex-1 grid grid-cols-2 gap-3">
                    <select
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      value={assignment.year}
                      onChange={(e) =>
                        handleAssignmentChange(index, "year", e.target.value)
                      }
                    >
                      <option value="">Year</option>
                      {years.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                    <select
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      value={assignment.section}
                      onChange={(e) =>
                        handleAssignmentChange(index, "section", e.target.value)
                      }
                    >
                      <option value="">Section</option>
                      {sections.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAssignment(index)}
                    disabled={assignments.length === 1}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-30"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 flex justify-center items-center gap-2 bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition shadow-md shadow-blue-200 disabled:opacity-70"
          >
            {loading ? "Processing..." : "Save Assignments"}
          </button>

          {message && (
            <div
              className={`p-3 rounded-lg text-sm text-center ${
                message.type === "success"
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {message.text}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

// More Actions Tab Component
function MoreActionsTab() {
  const [menu, setMenu] = useState("individual");

  const menuOptions = [
    { id: "individual", label: "Add Student" },
    { id: "addFaculty", label: "Add Faculty" },
    { id: "bulk", label: "Bulk Import" },
    { id: "reset", label: "Reset Password" },
    { id: "delete", label: "Delete Student" },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Sidebar Menu */}
      <div className="w-full lg:w-72 flex-shrink-0">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sticky top-4">
          <h2 className="text-lg font-bold text-gray-900 mb-4 px-2">
            Quick Actions
          </h2>
          <div className="space-y-1">
            {menuOptions.map((item) => (
              <button
                key={item.id}
                onClick={() => setMenu(item.id)}
                className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all ${
                  menu === item.id
                    ? "bg-slate-800 text-white shadow-md shadow-slate-200"
                    : "text-gray-600 hover:bg-gray-50 hover:text-slate-800"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dynamic Content Area */}
      <div className="flex-1">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {menu === "individual" && (
            <Suspense fallback={<LoadingSpinner />}>
              <AddIndividualStudentModel inline={true} />
            </Suspense>
          )}
          {menu === "addFaculty" && (
            <Suspense fallback={<LoadingSpinner />}>
              <AddFacultyModal inline={true} />
            </Suspense>
          )}
          {menu === "bulk" && (
            <Suspense fallback={<LoadingSpinner />}>
              <BulkImportModal />
            </Suspense>
          )}
          {menu === "reset" && (
            <Suspense fallback={<LoadingSpinner />}>
              <ResetPasswordModal />
            </Suspense>
          )}
          {menu === "delete" && (
            <Suspense fallback={<LoadingSpinner />}>
              <DeleteIndividualStudentModal />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
}

function HeadDashboard() {
  const { currentUser, logout } = useAuth();
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const { years, sections } = useMeta();
  const [filterYear, setFilterYear] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [search, setSearch] = useState("");
  const [selectedTab, setSelectedTab] = useState("Overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { key: "Overview", label: "Overview", icon: <FiHome /> },
    { key: "StudentRanking", label: "Student Management", icon: <FiUsers /> },
    { key: "FacultyManagment", label: "Faculty Management", icon: <FiGrid /> },
    { key: "More", label: "More Actions", icon: <FiUserPlus /> },
  ];

  const fetchFaculty = async () => {
    try {
      const { data } = await axios.get(
        `/api/hod/faculty?dept=${currentUser.dept_code}`
      );
      setFacultyList(data);
    } catch (error) {
      console.error("Error fetching faculty:", error);
    }
  };

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const { data } = await axios.get("/api/hod/students", {
          params: {
            dept: currentUser.dept_code,
            year: filterYear || "",
            section: filterSection || "",
          },
        });
        setStudents(data);
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };
    fetchStudents();
    if (currentUser.dept_code) {
      fetchFaculty();
    }
  }, [filterYear, filterSection, currentUser.dept_code]);

  const filteredStudents = students?.filter(
    (student) =>
      (filterYear === "" || student.year == filterYear) &&
      (filterSection === "" || student.section == filterSection) &&
      (student.name?.toLowerCase().includes(search.toLowerCase()) ||
        student.student_id?.toLowerCase().includes(search.toLowerCase()))
  );

  const formattedDate = dayjs().format("DD/MM/YYYY | hh:mm A");

  return (
    <>
      {selectedStudent && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-50 flex items-center justify-center h-screen bg-black/30">
              <LoadingSpinner />
            </div>
          }
        >
          <ViewProfile
            student={selectedStudent}
            onClose={() => setSelectedStudent(null)}
          />
        </Suspense>
      )}

      <Navbar toggleSidebar={() => setSidebarOpen(true)} />
      <div className="flex bg-gray-50 min-h-screen">
        <DashboardSidebar
          isOpen={sidebarOpen}
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          selectedTab={selectedTab}
          setSelectedTab={setSelectedTab}
          menuItems={menuItems}
          title="HOD Dashboard"
          onLogout={logout}
        />

        <div className="flex-1 lg:ml-64 transition-all duration-300">
          <div className="p-4 md:p-8 space-y-8">
            {/* Overview Section: Hero & Stats */}
            {selectedTab === "Overview" && (
              <>
                {/* Hero Section */}
                <div className="relative rounded-3xl overflow-hidden shadow-xl bg-gradient-to-r from-slate-800 to-slate-900 text-white p-6 md:p-10">
                  <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl"></div>
                  <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-60 h-60 rounded-full bg-indigo-500/10 blur-2xl"></div>

                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-3">
                      <span className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border border-white/10">
                        HOD Portal
                      </span>
                      <span className="text-slate-300 text-xs flex items-center gap-1">
                        <FiClock size={12} />
                        {formattedDate}
                      </span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-bold mb-2">
                      {currentUser.name}
                    </h1>
                    <p className="text-slate-300 text-lg">
                      Department of{" "}
                      <span className="font-semibold text-white">
                        {currentUser.dept_code}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StatsCard
                    icon={<FiUsers />}
                    title="Total Students"
                    value={currentUser.total_students || 0}
                    color="blue"
                  />
                  <StatsCard
                    icon={<FiUsers />}
                    title="Faculty Members"
                    value={currentUser.total_faculty || 0}
                    color="purple"
                  />
                  <StatsCard
                    icon={<FiLayers />}
                    title="Active Sections"
                    value={currentUser.total_sections || 0}
                    color="success"
                  />
                </div>

                {/* Live Rankings in Overview */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800">
                      Top Performers
                    </h2>
                    <p className="text-gray-500 text-sm">
                      Live department-wide student rankings
                    </p>
                  </div>
                  <Suspense fallback={<LoadingSpinner />}>
                    <RankingTable filter={true} />
                  </Suspense>
                </div>
              </>
            )}

            {/* Dedicated Tabs */}
            {selectedTab === "StudentRanking" && (
              <StudentManagementTab
                years={years}
                sections={sections}
                filterYear={filterYear}
                setFilterYear={setFilterYear}
                filterSection={filterSection}
                setFilterSection={setFilterSection}
                search={search}
                setSearch={setSearch}
                filteredStudents={filteredStudents}
                setSelectedStudent={setSelectedStudent}
                currentUser={currentUser}
              />
            )}

            {selectedTab === "FacultyManagment" && (
              <FacultyManagementTab
                years={years}
                sections={sections}
                facultyList={facultyList}
                refreshFacultyList={fetchFaculty}
              />
            )}

            {selectedTab === "More" && <MoreActionsTab />}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default HeadDashboard;
