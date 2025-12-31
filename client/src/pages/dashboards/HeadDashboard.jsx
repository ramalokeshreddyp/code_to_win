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
import UserProfile from "../../components/ui/UserProfile";
import { useMeta } from "../../context/MetaContext";
import Footer from "../../components/Footer";
import DashboardSidebar from "../../components/DashboardSidebar";
import { exportStudentsToExcel } from "../../utils/excelExport";
import {
  FiMenu,
  FiBarChart2,
  FiUsers,
  FiUserPlus,
  FiSettings,
  FiDownload,
} from "react-icons/fi";

// Lazy-loaded components
const RankingTable = lazy(() => import("../../components/Ranking"));
const ViewProfile = lazy(() => import("../../components/ViewProfile"));
const StudentTable = lazy(() => import("../../components/ui/StudentTable"));

// Stats Cards
function StatsCards({ currentUser }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-gray-500 text-sm">Total Students</h2>
        <p className="text-2xl font-bold">{currentUser.total_students}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-gray-500 text-sm">Faculty Members</h2>
        <p className="text-2xl font-bold">{currentUser.total_faculty}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-gray-500 text-sm">Sections</h2>
        <p className="text-2xl font-bold">{currentUser.total_sections}</p>
      </div>
    </div>
  );
}

// Student Management Tab
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
    <div className="bg-white rounded-lg shadow overflow-hidden min-w-full p-2 md:p-5">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold">Student Management</h2>
          <p className="text-gray-500">
            Manage student records, update details, and more.
          </p>
        </div>
        <button
          onClick={() =>
            exportStudentsToExcel(
              filteredStudents,
              `hod_students_${currentUser?.dept_code}`
            )
          }
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          <FiDownload />
          Export Excel
        </button>
      </div>
      <div className="flex gap-4 mb-4 items-end justify-between px-5">
        <div className="flex gap-5">
          <div>
            <label className="block text-sm font-medium mb-1">Year</label>
            <select
              className="border rounded px-2 py-1"
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
            >
              <option value="">All</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Section</label>
            <select
              className="border rounded px-2 py-1"
              value={filterSection}
              onChange={(e) => setFilterSection(e.target.value)}
            >
              <option value="">All</option>
              {sections.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="relative mt-5">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 opacity-85 text-blue-800" />
          <input
            type="text"
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-3 py-2 border w-[200px] border-gray-300 rounded-lg hover:bg-blue-50 focus:ring-1 focus:border-blue-100 transition focus:outline-none"
          />
        </div>
      </div>
      <Suspense
        fallback={
          <div className="fixed inset-0 z-50 flex items-center justify-center h-screen bg-black/30">
            <LoadingSpinner />
          </div>
        }
      >
        <div className="overflow-x-scroll md:overflow-hidden">
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

// Faculty Management Tab
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

      // Refresh faculty list to show updated assignments immediately
      if (refreshFacultyList) {
        refreshFacultyList();
      }

      // Reset form
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
    <div className="flex flex-col md:flex-row gap-6">
      <div className="w-full md:w-1/2 bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-1">Faculty Overview</h2>
        <p className="text-gray-500 mb-4">
          Current faculty and their assignments
        </p>
        <div className="space-y-4 h-96 overflow-y-scroll">
          {facultyList.map((faculty, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between border border-gray-200 rounded px-4 py-3 bg-gray-50"
            >
              <div>
                <div className="font-semibold text-lg">{faculty.name}</div>
                <div className="text-sm text-gray-600">
                  {faculty.assignments && faculty.assignments.length > 0 ? (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {faculty.assignments.map((assignment, idx) => (
                        <span
                          key={idx}
                          className="inline-block bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs"
                        >
                          {assignment.year}-{assignment.section}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400">Not assigned</span>
                  )}
                </div>
              </div>
              <span className="px-2 text-xs rounded-2xl border border-green-600 text-green-600 bg-white font-semibold">
                Active
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="w-full md:w-1/2 bg-white p-6 rounded-lg shadow max-h-[600px] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-1">Assign Sections to Faculty</h2>
        <p className="text-gray-500 mb-4">
          Assign multiple sections across different years to a faculty member
        </p>
        <form className="space-y-4" onSubmit={handleAssign}>
          <div>
            <label className="block text-sm font-medium mb-1">
              Select Faculty
            </label>
            <select
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedFaculty}
              onChange={(e) => setSelectedFaculty(e.target.value)}
            >
              <option value="">Choose faculty</option>
              {facultyList.map((faculty, idx) => (
                <option key={idx} value={faculty.faculty_id}>
                  {faculty.name}
                </option>
              ))}
            </select>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium">
                Section Assignments
              </label>
              <button
                type="button"
                onClick={handleAddAssignment}
                className="text-sm bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition"
              >
                + Add Section
              </button>
            </div>

            {assignments.map((assignment, index) => (
              <div key={index} className="flex gap-2 mb-3 items-start">
                <div className="flex-1">
                  <select
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={assignment.year}
                    onChange={(e) =>
                      handleAssignmentChange(index, "year", e.target.value)
                    }
                  >
                    <option value="">Choose year</option>
                    {years.map((year) => (
                      <option key={year} value={year}>
                        Year {year}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <select
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={assignment.section}
                    onChange={(e) =>
                      handleAssignmentChange(index, "section", e.target.value)
                    }
                  >
                    <option value="">Choose section</option>
                    {sections.map((s) => (
                      <option key={s} value={s}>
                        Section {s}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveAssignment(index)}
                  disabled={assignments.length === 1}
                  className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Remove assignment"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 flex justify-center items-center gap-2 bg-blue-600 text-white font-medium py-2 rounded hover:bg-blue-700 transition disabled:opacity-60"
          >
            {loading
              ? "Assigning..."
              : `Assign ${assignments.length} Section(s)`}
          </button>
          {message && (
            <div
              className={`mt-2 text-center text-sm ${
                message.type === "success" ? "text-green-600" : "text-red-600"
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

// Add Student Tab
function AddStudentTab() {
  const [menu, setMenu] = useState("individual");
  return (
    <div className="flex flex-col lg:flex-row gap-6 p-0 md:p-6 bg-gray-50">
      {/* Sidebar Menu */}
      <div className="w-full lg:w-1/4 bg-white p-4 md:p-6 rounded shadow mb-4 lg:mb-0">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          Add Students Menu
        </h2>
        <ul className="space-y-2">
          <li>
            <button
              className={`w-full text-left px-3 py-2 rounded ${
                menu === "individual"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-900"
              }`}
              onClick={() => setMenu("individual")}
            >
              Add Student
            </button>
          </li>
          <li>
            <button
              className={`w-full text-left px-3 py-2 rounded ${
                menu === "addFaculty"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-900"
              }`}
              onClick={() => setMenu("addFaculty")}
            >
              Add Faculty
            </button>
          </li>
          <li>
            <button
              className={`w-full text-left px-3 py-2 rounded ${
                menu === "bulk"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-900"
              }`}
              onClick={() => setMenu("bulk")}
            >
              Bulk Import
            </button>
          </li>
          <li>
            <button
              className={`w-full text-left px-3 py-2 rounded ${
                menu === "reset"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-900"
              }`}
              onClick={() => setMenu("reset")}
            >
              Reset Password
            </button>
          </li>
          <li>
            <button
              className={`w-full text-left px-3 py-2 rounded ${
                menu === "delete"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-900"
              }`}
              onClick={() => setMenu("delete")}
            >
              Delete
            </button>
          </li>
        </ul>
      </div>

      {/* Dynamic Content Area */}
      <div className="w-full lg:w-3/4">
        {menu === "individual" && (
          <div className="bg-white p-4 md:p-6 h-fit rounded shadow">
            <Suspense fallback={<LoadingSpinner />}>
              <AddIndividualStudentModel />
            </Suspense>
          </div>
        )}
        {menu === "addFaculty" && (
          <div className="bg-white p-4 md:p-6 h-fit rounded shadow">
            <Suspense fallback={<LoadingSpinner />}>
              <AddFacultyModal />
            </Suspense>
          </div>
        )}
        {menu === "bulk" && (
          <div className="bg-white p-4 md:p-6 h-fit rounded shadow">
            <Suspense fallback={<LoadingSpinner />}>
              <BulkImportModal />
            </Suspense>
          </div>
        )}
        {menu === "reset" && (
          <div className="bg-white p-4 md:p-6 h-fit rounded shadow">
            <Suspense fallback={<LoadingSpinner />}>
              <ResetPasswordModal />
            </Suspense>
          </div>
        )}
        {menu === "delete" && (
          <div className="bg-white p-4 md:p-6 h-fit rounded shadow">
            <Suspense fallback={<LoadingSpinner />}>
              <DeleteIndividualStudentModal />
            </Suspense>
          </div>
        )}
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
  const [selectedTab, setSelectedTab] = useState("StudentRanking");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { key: "StudentRanking", label: "Student Ranking", icon: <FiBarChart2 /> },
    { key: "StudentManagment", label: "Student Management", icon: <FiUsers /> },
    { key: "FacultyManagment", label: "Faculty Management", icon: <FiUsers /> },
    { key: "More", label: "More", icon: <FiUserPlus /> },
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

        <div className="flex-1 lg:ml-64">
          <div className="p-4 md:p-6 space-y-4">
            <UserProfile user={currentUser} />
            <StatsCards currentUser={currentUser} />

            {/* Content Sections with Suspense */}
            {selectedTab === "StudentRanking" && (
              <Suspense fallback={<LoadingSpinner />}>
                <RankingTable filter={true} />
              </Suspense>
            )}

            {selectedTab === "StudentManagment" && (
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

            {selectedTab === "More" && <AddStudentTab />}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default HeadDashboard;
