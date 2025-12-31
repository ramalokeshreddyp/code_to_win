import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  lazy,
  Suspense,
} from "react";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/Navbar";
import axios from "axios";
import LoadingSpinner from "../../common/LoadingSpinner";
import {
  AddIndividualStudentModel,
  DeleteIndividualStudentModal,
  ResetPasswordModal,
} from "../../components/Modals";
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
  FiCheckSquare,
  FiClock,
  FiRefreshCw,
  FiAward,
  FiHome,
} from "react-icons/fi";

// Lazy-loaded components
const RankingTable = lazy(() => import("../../components/Ranking"));
const ViewProfile = lazy(() => import("../../components/ViewProfile"));
const CodingProfileRequests = lazy(() =>
  import("../../components/ui/CodingProfileRequests")
);
const StudentTable = lazy(() => import("../../components/ui/StudentTable"));
const BulkImportWithCP = lazy(() =>
  import("../../components/ui/BulkImportWithCP")
);
const FacultyApprovals = lazy(() =>
  import("../../components/ui/FacultyApprovals")
);
const AdvancedExport = lazy(() => import("../../components/ui/AdvancedExport"));

function FacultyDashboard() {
  const { currentUser, logout } = useAuth();
  const [addStudentMenu, setAddStudentMenu] = useState("individual");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState("Overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Section Filter State
  const [sectionFilter, setSectionFilter] = useState("all");

  const menuItems = [
    { key: "Overview", label: "Overview", icon: <FiHome /> },
    {
      key: "StudentManagement",
      label: "Student Management",
      icon: <FiUsers />,
    },
    {
      key: "Approvals",
      label: "Approvals & Requests",
      icon: <FiCheckSquare />,
    },
    { key: "ExportData", label: "Export Data", icon: <FiDownload /> },
    { key: "MoreActions", label: "More Actions", icon: <FiUserPlus /> },
  ];

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/faculty/students`, {
        params: {
          dept: currentUser?.dept_code,
          userId: currentUser?.faculty_id,
        },
      });
      setStudents(data);
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.dept_code, currentUser?.faculty_id]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Derived unique sections for the filter dropdown
  const uniqueSections = useMemo(() => {
    const options = new Set();
    students.forEach((s) => {
      // Ensure we only add valid year-section combos
      if (s.year && s.section) {
        options.add(`${s.year}-${s.section}`);
      }
    });
    return Array.from(options).sort();
  }, [students]);

  // Filter students based on selection
  const filteredStudents = useMemo(() => {
    if (sectionFilter === "all") return students;
    const [fYear, fSection] = sectionFilter.split("-");
    return students.filter((s) => s.year == fYear && s.section == fSection);
  }, [students, sectionFilter]);

  // Calculate Class Stats based on ALL students (not filtered) or filtered? usually all.
  // Let's stick to ALL for the stats cards to show overall load.
  const classStats = useMemo(() => {
    if (!students.length) return { total: 0, avgScore: 0 };
    const total = students.length;
    const totalScore = students.reduce(
      (sum, s) => sum + (parseFloat(s.score) || 0),
      0
    );
    const avgScore = (totalScore / total).toFixed(1);
    return { total, avgScore };
  }, [students]);

  const formattedDate = dayjs().format("DD/MM/YYYY | hh:mm A");

  const handleRefreshData = () => {
    setRefreshing(true);
    fetchStudents().then(() => {
      setTimeout(() => setRefreshing(false), 800);
    });
  };

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
          title="Faculty Dashboard"
          onLogout={logout}
        />

        <div className="flex-1 lg:ml-64 transition-all duration-300">
          <div className="p-4 md:p-8 space-y-8">
            {/* Hero & Stats - ONLY on Overview */}
            {selectedTab === "Overview" && (
              <>
                {/* Hero Section */}
                <div className="relative rounded-3xl overflow-hidden shadow-xl bg-gradient-to-r from-slate-800 to-slate-900 text-white p-6 md:p-10">
                  <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl"></div>
                  <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-60 h-60 rounded-full bg-indigo-500/10 blur-2xl"></div>

                  <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                      <div className="flex items-center gap-4 mb-3">
                        <span className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border border-white/10">
                          Faculty Portal
                        </span>
                        <span className="text-slate-300 text-xs flex items-center gap-1">
                          <FiClock size={12} />
                          {formattedDate}
                        </span>
                      </div>
                      <h1 className="text-3xl md:text-5xl font-bold mb-2">
                        Hello, {currentUser.name?.split(" ")[0]}
                      </h1>
                      <p className="text-slate-300 text-lg">
                        Managing Class:{" "}
                        <span className="font-semibold text-white">
                          {currentUser?.assignments?.length > 0
                            ? currentUser.assignments
                                .map((a) => `${a.year}-${a.section}`)
                                .join(", ")
                            : `${currentUser?.year}-${currentUser?.section}`}
                        </span>{" "}
                        ({currentUser?.dept_code})
                      </p>
                    </div>

                    <div className="flex gap-4">
                      <button
                        onClick={handleRefreshData}
                        disabled={refreshing}
                        className="px-5 py-2.5 bg-white/10 backdrop-blur-md text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all flex items-center gap-2"
                      >
                        <FiRefreshCw
                          className={refreshing ? "animate-spin" : ""}
                        />
                        {refreshing ? "Syncing..." : "Sync Data"}
                      </button>
                      <button
                        onClick={() =>
                          exportStudentsToExcel(
                            students, // Export ALL students from here if desired, or filtered
                            `faculty_students_${currentUser?.dept_code}_All`
                          )
                        }
                        className="px-5 py-2.5 bg-green-600 text-white font-semibold rounded-xl shadow-lg hover:bg-green-700 transition-all flex items-center gap-2"
                      >
                        <FiDownload /> Export Excel
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatsCard
                    icon={<FiUsers />}
                    title="Total Students"
                    value={classStats.total}
                    color="blue"
                  />
                  <StatsCard
                    icon={<FiAward />}
                    title="Class Avg Score"
                    value={classStats.avgScore}
                    color="success"
                  />
                  <StatsCard
                    icon={<FiCheckSquare />}
                    title="Pending Approvals"
                    value="Check Tab"
                    color="warning"
                  />
                  <StatsCard
                    icon={<FiBarChart2 />}
                    title="Performance"
                    value="View"
                    color="purple"
                  />
                </div>
              </>
            )}

            {/* Main Content Area */}
            <div className="min-h-[500px]">
              {loading && !students.length ? (
                <div className="flex justify-center py-20">
                  <LoadingSpinner />
                </div>
              ) : (
                <>
                  {selectedTab === "Overview" && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                      <div className="p-6 border-b border-gray-100">
                        <h2 className="text-xl font-bold text-gray-800">
                          Live Rankings
                        </h2>
                        <p className="text-gray-500 text-sm">
                          Real-time performance leaderboard for your class
                        </p>
                      </div>
                      <Suspense fallback={<LoadingSpinner />}>
                        <RankingTable filter={true} />
                      </Suspense>
                    </div>
                  )}

                  {selectedTab === "StudentManagement" && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <div>
                          <h2 className="text-xl font-bold text-gray-800">
                            Student Management
                          </h2>
                          <p className="text-gray-500 text-sm">
                            View and manage student profiles details
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-3 items-center">
                          {/* DYNAMIC SECTION FILTER */}
                          {uniqueSections.length > 1 && (
                            <select
                              className="border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                              value={sectionFilter}
                              onChange={(e) => setSectionFilter(e.target.value)}
                            >
                              <option value="all">
                                All Sections ({students.length})
                              </option>
                              {uniqueSections.map((sec) => (
                                <option key={sec} value={sec}>
                                  Year {sec.split("-")[0]} - Sec{" "}
                                  {sec.split("-")[1]}
                                </option>
                              ))}
                            </select>
                          )}

                          <button
                            onClick={() =>
                              exportStudentsToExcel(
                                filteredStudents,
                                `faculty_students_${currentUser?.dept_code}_Filtered`
                              )
                            }
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                          >
                            <FiDownload />
                            Export Excel
                          </button>
                        </div>
                      </div>

                      <Suspense
                        fallback={
                          <div className="py-10 text-center">
                            <LoadingSpinner />
                          </div>
                        }
                      >
                        <div className="overflow-x-auto">
                          <StudentTable
                            students={filteredStudents}
                            showBranch={true}
                            showYear={true}
                            showSection={true}
                            onProfileClick={setSelectedStudent}
                          />
                        </div>
                      </Suspense>
                    </div>
                  )}

                  {/* Combined Approvals Tab */}
                  {selectedTab === "Approvals" && (
                    <div className="space-y-8">
                      {/* Section 1: Coding Profile Requests */}
                      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-2">
                          Coding Profile Requests
                        </h2>
                        <p className="text-gray-500 text-sm mb-6">
                          Verify students' coding platform handles
                        </p>
                        <Suspense fallback={<LoadingSpinner />}>
                          <CodingProfileRequests
                            dept={currentUser?.dept_code}
                            userId={currentUser?.faculty_id}
                            facultyId={currentUser?.faculty_id}
                          />
                        </Suspense>
                      </div>

                      {/* Section 2: Achievement Approvals */}
                      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-2">
                          Achievement Approvals
                        </h2>
                        <p className="text-gray-500 text-sm mb-6">
                          Review and approve student achievement submissions
                        </p>
                        <Suspense fallback={<LoadingSpinner />}>
                          <FacultyApprovals
                            facultyId={currentUser?.faculty_id}
                          />
                        </Suspense>
                      </div>
                    </div>
                  )}

                  {selectedTab === "ExportData" && (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                      <div className="mb-6">
                        <h2 className="text-xl font-bold text-gray-800">
                          Advanced Data Export
                        </h2>
                        <p className="text-gray-500 text-sm">
                          Select specific fields and download custom reports for
                          your students.
                        </p>
                      </div>
                      <Suspense fallback={<LoadingSpinner />}>
                        <AdvancedExport
                          students={students}
                          filenamePrefix={`Faculty_Export_${currentUser?.dept_code}`}
                        />
                      </Suspense>
                    </div>
                  )}

                  {selectedTab === "MoreActions" && (
                    <div className="flex flex-col lg:flex-row gap-8">
                      {/* Sidebar Menu */}
                      <div className="w-full lg:w-72 flex-shrink-0">
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sticky top-4">
                          <h2 className="text-lg font-bold text-gray-900 mb-4 px-2">
                            Actions
                          </h2>
                          <div className="space-y-1">
                            {[
                              { id: "individual", label: "Add Student" },
                              { id: "bulk", label: "Bulk Import" },
                              { id: "delete", label: "Delete Student" },
                              { id: "resetpassword", label: "Reset Password" },
                            ].map((item) => (
                              <button
                                key={item.id}
                                onClick={() => setAddStudentMenu(item.id)}
                                className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all ${
                                  addStudentMenu === item.id
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
                        {addStudentMenu === "individual" && (
                          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 md:p-6">
                            <Suspense fallback={<LoadingSpinner />}>
                              <AddIndividualStudentModel
                                onSuccess={fetchStudents}
                                inline={true}
                              />
                            </Suspense>
                          </div>
                        )}
                        {addStudentMenu === "bulk" && (
                          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-1">
                              Bulk Import Students
                            </h2>
                            <p className="text-sm text-gray-500 mb-6">
                              Import multiple students from CSV file
                            </p>
                            <Suspense fallback={<LoadingSpinner />}>
                              <BulkImportWithCP onSuccess={fetchStudents} />
                            </Suspense>
                          </div>
                        )}
                        {addStudentMenu === "delete" && (
                          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <Suspense fallback={<LoadingSpinner />}>
                              <DeleteIndividualStudentModal
                                onSuccess={fetchStudents}
                              />
                            </Suspense>
                          </div>
                        )}
                        {addStudentMenu === "resetpassword" && (
                          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-1">
                              Reset Student Password
                            </h2>
                            <p className="text-sm text-gray-500 mb-6">
                              Reset the password for a student
                            </p>
                            <Suspense fallback={<LoadingSpinner />}>
                              <ResetPasswordModal onSuccess={fetchStudents} />
                            </Suspense>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default FacultyDashboard;
