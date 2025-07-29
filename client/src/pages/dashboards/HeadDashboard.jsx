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

// Tabs
function DashboardTabs({ selectedTab, setSelectedTab }) {
  const tabs = [
    { key: "StudentRanking", label: "Student Ranking" },
    { key: "StudentManagment", label: "Student Management" },
    { key: "FacultyManagment", label: "Faculty Management" },
    { key: "More", label: "More" },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 justify-around rounded bg-gray-100 border-gray-200 border gap-2 md:gap-4 p-1 mb-4 text-base">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => setSelectedTab(tab.key)}
          className={`flex-1 min-w-[120px] py-1 rounded ${
            selectedTab === tab.key ? "bg-white text-black" : ""
          }`}
        >
          {tab.label}
        </button>
      ))}
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
}) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden min-w-full p-2 md:p-5">
      <h2 className="text-xl font-semibold mb-4">Student Management</h2>
      <p className="text-gray-500 mb-4">
        Manage student records, update details, and more.
      </p>
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
function FacultyManagementTab({ years, sections, facultyList }) {
  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAssign = async (e) => {
    e.preventDefault();
    setMessage(null);
    if (!selectedFaculty || !selectedYear || !selectedSection) {
      setMessage({ type: "error", text: "All fields are required." });
      return;
    }
    setLoading(true);
    try {
      await axios.post("/api/hod/assign-faculty", {
        faculty_id: selectedFaculty,
        dept_code: facultyList.find((f) => f.faculty_id === selectedFaculty)
          ?.dept_code,
        year: selectedYear,
        section: selectedSection,
      });
      setMessage({ type: "success", text: "Section assigned successfully!" });
    } catch (err) {
      setMessage({
        type: "error",
        text:
          err.response?.data?.message ||
          "Failed to assign section. Please try again.",
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
                  Sections: {faculty.section} | Year: {faculty.year}
                </div>
              </div>
              <span className="px-2 text-xs rounded-2xl border border-green-600 text-green-600 bg-white font-semibold">
                Active
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="w-full md:w-1/2 bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-1">Assign Section to Faculty</h2>
        <p className="text-gray-500 mb-4">
          Assign a section and year to a faculty member
        </p>
        <form className="space-y-3" onSubmit={handleAssign}>
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
          <div>
            <label className="block text-sm font-medium mb-1">Year</label>
            <select
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              <option value="">Choose year</option>
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
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
            >
              <option value="">Choose section</option>
              {sections.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 flex justify-center items-center gap-2 bg-blue-600 text-white font-medium py-2 rounded hover:bg-blue-700 transition disabled:opacity-60"
          >
            {loading ? "Assigning..." : "Assign Section"}
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
  const { currentUser } = useAuth();
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const { years, sections } = useMeta();
  const [filterYear, setFilterYear] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [search, setSearch] = useState("");
  const [selectedTab, setSelectedTab] = useState("StudentRanking");

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

      <Navbar />
      <div className="bg-gray-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-8 space-y-4 p-2 md:p-6">
          <h1 className="text-2xl font-semibold">HOD Dashboard</h1>
          <UserProfile user={currentUser} />
          <StatsCards currentUser={currentUser} />
          <DashboardTabs
            selectedTab={selectedTab}
            setSelectedTab={setSelectedTab}
          />

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
            />
          )}

          {selectedTab === "FacultyManagment" && (
            <FacultyManagementTab
              years={years}
              sections={sections}
              facultyList={facultyList}
            />
          )}

          {selectedTab === "More" && <AddStudentTab />}
        </div>
      </div>
      <Footer />
    </>
  );
}

export default HeadDashboard;
