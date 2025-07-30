import React, { useEffect, useState, lazy, Suspense } from "react";
import {
  FaGraduationCap,
  FaPeopleGroup,
  FaUpload,
  FaUser,
  FaUserGraduate,
  FaUserPlus,
} from "react-icons/fa6";
import { FaSearch, FaUserSlash } from "react-icons/fa";
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
import BulkImportStudent from "../../components/ui/BulkImportStudent";
import UserProfile from "../../components/ui/UserProfile";
import { IoPeopleOutline } from "react-icons/io5";
import DashboardSidebar from "../../components/DashboardSidebar";
import {
  FiMenu,
  FiBarChart2,
  FiUsers,
  FiUserPlus as FiUserPlusIcon,
  FiSettings,
} from "react-icons/fi";

// Lazy-loaded components
const RankingTable = lazy(() => import("../../components/Ranking"));
const ViewProfile = lazy(() => import("../../components/ViewProfile"));
const StudentTable = lazy(() => import("../../components/ui/StudentTable"));
// Stats Cards

function StatsCards({ currentUser }) {
  return (
    <div className="grid md:grid-cols-4 gap-4">
      <div className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
        <div>
          <p className="text-2xl font-bold flex justify-between">
            {currentUser.total_students}
          </p>
          <h2 className="text-gray-500 text-sm">Total Students</h2>
        </div>
        <div className="p-4 bg-violet-100 rounded-md">
          {" "}
          <FaUserGraduate className="text-[#7839ee]" size={30} />{" "}
        </div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
        <div>
          <p className="text-2xl font-bold">{currentUser.total_faculty}</p>
          <h2 className="text-gray-500 text-sm">Faculty Members</h2>
        </div>
        <div className="p-4 bg-sky-100 rounded-md">
          {" "}
          <IoPeopleOutline color="blue" size={30} />{" "}
        </div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
        <div>
          <p className="text-2xl font-bold">{currentUser.total_sections}</p>
          <h2 className="text-gray-500 text-sm">Sections</h2>
        </div>
        <div className="p-4 bg-green-100 rounded-md">
          {" "}
          <FaGraduationCap color="green" size={30} />{" "}
        </div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
        <div>
          <p className="text-2xl font-bold">{currentUser.total_sections}</p>
          <h2 className="text-gray-500 text-sm">Sections</h2>
        </div>
        <div className="p-4 bg-green-100 rounded-md">
          {" "}
          <FaGraduationCap color="green" size={30} />{" "}
        </div>
      </div>
    </div>
  );
}
function FacultyManagementTab({ years, sections, facultyList }) {
  const [AddFacultyModal, setAddFacultyModal] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  function AddFaculty({ onClose }) {
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
      <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
        <div className="w-md relative bg-white p-6 rounded-lg shadow">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-xl font-bold text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            &times;
          </button>
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
  return (
    <div className="w-full  bg-white  rounded-lg shadow mt-10">
      {AddFacultyModal && (
        <AddFaculty onClose={() => setAddFacultyModal(false)} />
      )}
      <div className="w-full flex  p-6 items-center justify-between">
        <h2 className="text-lg md:text-2xl font-bold">Faculty Assignment</h2>
        <button
          className="bg-blue-500 md:px-3 md:py-2 p-1.5 text-sm md:text-base  rounded-lg text-white flex items-center md:gap-2 gap-1"
          onClick={() => setAddFacultyModal(true)}
        >
          <FaUserPlus />
          Add <span className="hidden md:block">Faculty</span>
        </button>
      </div>
      <div className="space-y-4">
        <table className="w-full bg-white  overflow-hidden  md:text-sm text-xs text-gray-900 ">
          <thead className="bg-gray-100 text-left  w-full ">
            <tr>
              <th className=" px-10 font-light">FACULTY</th>
              <th className="md:p-3 p-2  font-light ">ROLE</th>
              <th className="md:p-3 p-2  font-light "> ASSIGNED SECTION</th>
              <th className="md:p-3 p-2 sr-only md:not-sr-only font-light ">
                STATUS
              </th>
              <th className="md:p-3 p-2  font-light ">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {facultyList.length === 0 && (
              <tr className="text-center">
                <td colSpan={8} className="text-center py-10 text-gray-500">
                  NO data founded
                </td>
              </tr>
            )}
            {facultyList.map((faculty, index) => (
              <tr
                key={index}
                className="border-gray-100 hover:bg-gray-50 text-center md:text-left"
              >
                <td className="py-5 px-3 flex  items-center gap-6 text-black font-medium text-left">
                  <div className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 hidden md:flex items-center text-sm justify-center font-bold">
                    {faculty.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div className="flex flex-col text-sm">
                    {faculty.name}
                    <span>{faculty.name}@aec.edu.in</span>
                  </div>
                </td>
                <td>Employee</td>
                <td>4th AIML</td>
                <td className="sr-only md:not-sr-only">
                  <span className="bg-green-100 text-green-600 px-3 rounded-2xl py-1">
                    Active
                  </span>
                </td>
                <td>
                  <button className="bg-blue-500 px-4 py-1 cursor-pointer  rounded-md text-white ">
                    Update
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* <div className="w-full md:w-1/2 bg-white p-6 rounded-lg shadow">
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
                            className={`mt-2 text-center text-sm ${message.type === "success" ? "text-green-600" : "text-red-600"
                                }`}
                        >
                            {message.text}
                        </div>
                    )}
                </form>
            </div> */}
    </div>
  );
}

function HODDashboard() {
  const { currentUser, logout } = useAuth();
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [facultyList, setFacultyList] = useState([]);
  const [years, setYears] = useState([]);
  const [sections, setSections] = useState([]);
  const [filterYear, setFilterYear] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [search, setSearch] = useState("");
  const [selectedTab, setSelectedTab] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { key: "Dashboard", label: "Dashboard", icon: <FiBarChart2 /> },
    { key: "StudentRanking", label: "Student Ranking", icon: <FiBarChart2 /> },
    {
      key: "FacultyManagement",
      label: "Faculty Management",
      icon: <FiUsers />,
    },
    {
      key: "StudentManagement",
      label: "Student Management",
      icon: <FiUserPlusIcon />,
    },
    { key: "Settings", label: "Settings", icon: <FiSettings /> },
  ];

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
        if (filterYear === "" && filterSection === "") {
          const uniqueYears = [...new Set(data.map((s) => s.year))].sort(
            (a, b) => a - b
          );
          setYears(uniqueYears);
          const uniqueSections = [...new Set(data.map((s) => s.section))];
          setSections(uniqueSections);
        }
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
      <Suspense
        fallback={
          <div className="fixed inset-0 z-50 flex items-center justify-center h-screen bg-black/30">
            <LoadingSpinner />
          </div>
        }
      ></Suspense>

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
          {/* Mobile menu button */}
          <div className="lg:hidden p-4 bg-white border-b">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md hover:bg-gray-100"
            >
              <FiMenu size={20} />
            </button>
          </div>

          <div className="p-4 md:p-6 space-y-4">
            {selectedTab === "Dashboard" && (
              <>
                <StatsCards currentUser={currentUser} />
                <div className="flex flex-col lg:flex-row gap-8">
                  <div className="w-full h-80 bg-white p-4 sm:p-6 rounded-lg shadow mt-10">
                    <h3 className="text-lg font-semibold mb-4">
                      Recent Activities
                    </h3>
                    <p className="text-gray-500">
                      Dashboard content will be displayed here.
                    </p>
                  </div>
                  <div className="w-full h-80 bg-white p-4 sm:p-6 rounded-lg shadow mt-10">
                    <h3 className="text-lg font-semibold mb-4">Analytics</h3>
                    <p className="text-gray-500">
                      Analytics content will be displayed here.
                    </p>
                  </div>
                </div>
              </>
            )}

            {selectedTab === "FacultyManagement" && (
              <FacultyManagementTab
                years={years}
                sections={sections}
                facultyList={facultyList}
              />
            )}

            {selectedTab === "StudentRanking" && (
              <Suspense fallback={<LoadingSpinner />}>
                <RankingTable filter={true} />
              </Suspense>
            )}

            {selectedTab === "StudentManagement" && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">
                  Student Management
                </h2>
                <p className="text-gray-500">
                  Student management features will be displayed here.
                </p>
              </div>
            )}

            {selectedTab === "Settings" && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Settings</h2>
                <p className="text-gray-500">
                  Settings panel will be displayed here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default HODDashboard;
