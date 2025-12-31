import React, { useState, lazy, useMemo, useEffect, Suspense } from "react";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/Navbar";
import LoadingSpinner from "../../common/LoadingSpinner";
import Footer from "../../components/Footer";
import UserProfile from "../../components/ui/UserProfile";
import DashboardSidebar from "../../components/DashboardSidebar";
import {
  FiMenu,
  FiUsers,
  FiUserCheck,
  FiSettings,
  FiUserPlus,
  FiMail,
  FiBarChart2,
  FiDownload,
} from "react-icons/fi";
import { useMeta } from "../../context/MetaContext";
import toast from "react-hot-toast";

// Lazy-loaded components
const AdminAnalyticsDashboard = lazy(() => import("./AdminAnalyticsDashboard"));
const RankingTable = lazy(() => import("../../components/Ranking"));
const ViewProfile = lazy(() => import("../../components/ViewProfile"));
const ContactRequests = lazy(() =>
  import("../../components/ui/ContactRequests")
);
const FacultyList = lazy(() => import("../../components/ui/FacultyList"));
const HODList = lazy(() => import("../../components/ui/HODList"));
const StudentTable = lazy(() => import("../../components/ui/StudentTable"));
const AddFacultyModal = lazy(() =>
  import("../../components/Modals").then((m) => ({
    default: m.AddFacultyModal,
  }))
);
const AddHODModal = lazy(() =>
  import("../../components/Modals").then((m) => ({ default: m.AddHODModal }))
);
const ResetPasswordModal = lazy(() =>
  import("../../components/Modals").then((m) => ({
    default: m.ResetPasswordModal,
  }))
);
const BulkImportModal = lazy(() =>
  import("../../components/Modals").then((m) => ({
    default: m.BulkImportModal,
  }))
);
const AddIndividualStudentModel = lazy(() =>
  import("../../components/Modals").then((m) => ({
    default: m.AddIndividualStudentModel,
  }))
);
const AddBranchModal = lazy(() =>
  import("../../components/Modals").then((m) => ({ default: m.AddBranchModal }))
);

const metricToPlatform = {
  stars_hr: "HackerRank",
  contests_cc: "CodeChef",
  easy_gfg: "GeeksforGeeks",
  medium_gfg: "GeeksforGeeks",
  hard_gfg: "GeeksforGeeks",
  school_gfg: "GeeksforGeeks",
  easy_lc: "LeetCode",
  medium_lc: "LeetCode",
  hard_lc: "LeetCode",
  problems_cc: "CodeChef",
  stars_cc: "CodeChef",
  basic_gfg: "GeeksforGeeks",
  badges_cc: "CodeChef",
  badges_lc: "LeetCode",
  contests_lc: "LeetCode",
  contests_gfg: "GeeksforGeeks",
  repos_gh: "GitHub",
  contributions_gh: "GitHub",
};

const platformOrder = [
  "LeetCode",
  "GeeksforGeeks",
  "CodeChef",
  "HackerRank",
  "GitHub",
];

// Verification Toggle Component for SA07
function VerificationToggle() {
  const [verificationRequired, setVerificationRequired] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVerificationStatus();
  }, []);

  const fetchVerificationStatus = async () => {
    try {
      const res = await fetch("/api/admin/settings?userId=SA07");
      const data = await res.json();
      setVerificationRequired(data.verification_required);
    } catch (err) {
      console.error("Failed to fetch verification status");
    }
    setLoading(false);
  };

  const toggleVerification = async () => {
    try {
      const res = await fetch("/api/admin/toggle-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "SA07",
          enabled: !verificationRequired,
        }),
      });

      if (res.ok) {
        setVerificationRequired(!verificationRequired);
        toast.success(
          `Verification ${!verificationRequired ? "enabled" : "disabled"}`
        );
      } else {
        toast.error("Failed to update verification setting");
      }
    } catch (err) {
      toast.error("Error updating verification setting");
    }
  };

  if (loading) return <div className="text-center py-4">Loading...</div>;

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-yellow-800">
            Faculty Verification
          </h3>
          <p className="text-sm text-yellow-700">
            {verificationRequired
              ? "Students need faculty approval before scraping starts"
              : "Students profiles are auto-approved and scraping starts immediately"}
          </p>
        </div>
        <button
          onClick={toggleVerification}
          className={`px-4 py-2 rounded font-medium transition ${
            verificationRequired
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-red-600 hover:bg-red-700 text-white"
          }`}
        >
          {verificationRequired ? "Turn OFF" : "Turn ON"}
        </button>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const { currentUser, logout } = useAuth();
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedTab, setSelectedTab] = useState("Analytics");
  const [grading, setGrading] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userMgmtTab, setUserMgmtTab] = useState("addBranch");
  const [changedMetrics, setChangedMetrics] = useState(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [customFilters, setCustomFilters] = useState({
    dept: "",
    year: "",
    section: "",
  });
  const [deptWiseFilter, setDeptWiseFilter] = useState("");
  const { depts, years, sections } = useMeta();

  const menuItems = [
    { key: "Analytics", label: "Analytics Dashboard", icon: <FiBarChart2 /> },
    { key: "StudentRanking", label: "Student Ranking", icon: <FiBarChart2 /> },
    { key: "ManageStudents", label: "Manage Students", icon: <FiUsers /> },
    { key: "FacultyList", label: "Faculty List", icon: <FiUserCheck /> },
    { key: "HODList", label: "HOD List", icon: <FiUserCheck /> },
    { key: "GradingSystem", label: "Grading System", icon: <FiSettings /> },
    { key: "UserManagment", label: "User Management", icon: <FiUserPlus /> },
    { key: "ContactRequests", label: "Contact Requests", icon: <FiMail /> },
    { key: "Downloads", label: "Downloads", icon: <FiDownload /> },
  ];

  // Helper to make metric names readable
  const metricLabels = {
    stars_hr: "HackerRank Badges",
    contests_cc: "CodeChef Contests",
    problems_cc: "CodeChef Problems",
    stars_cc: "CodeChef Stars",
    badges_cc: "CodeChef Badges",
    school_gfg: "GeeksforGeeks School",
    basic_gfg: "GeeksforGeeks Basic",
    easy_gfg: "GeeksforGeeks Easy",
    hard_gfg: "GeeksforGeeks Hard",
    medium_gfg: "GeeksforGeeks Medium",
    contests_gfg: "GeeksforGeeks Contests",
    easy_lc: "LeetCode Easy",
    hard_lc: "LeetCode Hard",
    medium_lc: "LeetCode Medium",
    badges_lc: "LeetCode Badges",
    contests_lc: "LeetCode Contests",
    repos_gh: "GitHub Repositories",
    contributions_gh: "GitHub Contributions",
  };
  useEffect(() => {
    const fetchGrading = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/meta/grading");
        const data = await res.json();
        setGrading(data.grading || []);
      } catch (err) {
        alert("Failed to load grading config");
        setGrading([]);
      }
      setLoading(false);
    };
    fetchGrading();
  }, []);

  const handleGradingChange = (idx, value) => {
    setGrading((prev) =>
      prev.map((item, i) =>
        i === idx ? { ...item, points: parseInt(value) || 0 } : item
      )
    );
    setChangedMetrics((prev) => {
      const updated = new Set(prev);
      updated.add(grading[idx].metric);
      return updated;
    });
  };

  const handleGradingSubmit = async (e) => {
    e.preventDefault();
    try {
      // Only update changed metrics
      const updates = grading.filter((item) => changedMetrics.has(item.metric));
      await Promise.all(
        updates.map((item) =>
          fetch(`/api/meta/grading/${item.metric}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ points: item.points }),
          })
        )
      );
      alert("Grading configuration saved!");
      setChangedMetrics(new Set()); // Clear changed set after save
    } catch (err) {
      alert("Failed to save configuration.");
      console.error(err);
    }
  };

  // Group grading metrics by platform
  const gradingByPlatform = useMemo(() => {
    const grouped = {};
    grading.forEach((item) => {
      const platform = metricToPlatform[item.metric] || "Other";
      if (!grouped[platform]) grouped[platform] = [];
      grouped[platform].push(item);
    });
    return grouped;
  }, [grading]);

  const handleDownload = async (type) => {
    try {
      toast.loading("Preparing download...");
      let url = `/api/download/${type}`;

      if (type === "custom") {
        const params = new URLSearchParams(customFilters).toString();
        url += `?${params}`;
      } else if (type === "department-wise") {
        if (!deptWiseFilter) {
          toast.dismiss();
          toast.error("Please select a department first.");
          return;
        }
        url += `?dept=${deptWiseFilter}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error("Download failed");

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download =
        response.headers
          .get("Content-Disposition")
          ?.split("filename=")[1]
          ?.replace(/"/g, "") || `${type}_data.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);

      toast.dismiss();
      toast.success("Download completed!");
    } catch (error) {
      toast.dismiss();
      toast.error("Download failed. Please try again.");
      console.error("Download error:", error);
    }
  };

  return (
    <>
      {/* Show ViewProfile only if a student is selected */}
      <Suspense fallback={<LoadingSpinner />}>
        {selectedStudent && (
          <ViewProfile
            student={selectedStudent}
            onClose={() => setSelectedStudent(null)}
          />
        )}
      </Suspense>
      <Navbar toggleSidebar={() => setSidebarOpen(true)} />
      <div className="flex bg-gray-50 min-h-screen">
        <DashboardSidebar
          isOpen={sidebarOpen}
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          selectedTab={selectedTab}
          setSelectedTab={setSelectedTab}
          menuItems={menuItems}
          title="Admin Dashboard"
          onLogout={logout}
        />

        <div className="flex-1 lg:ml-64">
          <div className="p-4 md:p-6 space-y-4">
            {/* Admin Info */}
            {/* <UserProfile user={currentUser} /> */}

            {/* Section Stats Cards */}
            {/* <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="bg-white p-4 rounded-lg shadow">
                <h2 className="text-gray-500 text-sm">Total Students</h2>
                <p className="text-2xl font-bold">
                  {currentUser.total_students}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h2 className="text-gray-500 text-sm">Total HOD's</h2>
                <p className="text-2xl font-bold">{currentUser.total_hod}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h2 className="text-gray-500 text-sm">Total Faculty</h2>
                <p className="text-2xl font-bold">
                  {currentUser.total_faculty}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h2 className="text-gray-500 text-sm">Today's Visitors</h2>
                <p className="text-2xl font-bold">
                  {currentUser.visitor_stats?.today_visits || 0}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <h2 className="text-gray-500 text-sm flex items-center gap-1">
                  Live Visitors
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                </h2>
                <p className="text-2xl font-bold text-green-600">
                  {currentUser.visitor_stats?.live_visitors || 0}
                </p>
              </div>
            </div> */}

            {/* Analytics Dashboard */}
            {selectedTab === "Analytics" && (
              <Suspense fallback={<LoadingSpinner />}>
                <AdminAnalyticsDashboard />
              </Suspense>
            )}

            {/* Student Ranking */}
            {selectedTab === "StudentRanking" && (
              <Suspense fallback={<LoadingSpinner />}>
                <RankingTable filter={true} />
              </Suspense>
            )}

            {/* Manage Students */}
            {selectedTab === "ManageStudents" && (
              <div className="md:bg-white md:p-6 rounded-lg md:shadow">
                <h2 className="text-xl font-semibold mb-4">Manage Students</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {currentUser.students_per_dept.map((dept) => (
                    <div className="bg-white p-4 rounded-lg shadow">
                      <h2 className="text-gray-500 text-lg">
                        {dept.dept_name}
                      </h2>
                      <p className="text-xl font-bold">
                        {dept.student_count || 0}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="text-gray-500 mb-4">
                  View and modify student records across all departments.
                </p>
                <Suspense fallback={<LoadingSpinner />}>
                  <StudentTable
                    showBranch={true}
                    showYear={true}
                    showSection={true}
                    onProfileClick={setSelectedStudent}
                    adminView={true}
                  />
                </Suspense>
              </div>
            )}
            {/* Grading System */}
            {selectedTab === "GradingSystem" && (
              <div className="bg-white px-4 py-8">
                <h1 className="text-2xl font-bold text-center mb-6">
                  System Configuration
                </h1>

                {/* Verification Toggle - SA07 Only */}
                {currentUser.user_id === "SA07" && <VerificationToggle />}

                <h2 className="text-xl font-semibold mb-4 mt-8">
                  Grading Configuration
                </h2>

                {loading ? (
                  <div className="text-center py-8">
                    Loading grading config...
                  </div>
                ) : (
                  <form
                    onSubmit={handleGradingSubmit}
                    className="space-y-8 mx-auto"
                  >
                    {platformOrder.map(
                      (platform) =>
                        gradingByPlatform[platform] && (
                          <div key={platform} className="mb-6 ">
                            <h2 className="text-xl font-semibold mb-4 text-blue-700">
                              {platform}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {gradingByPlatform[platform].map((item, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center justify-between py-2"
                                >
                                  <span className="font-medium">
                                    {metricLabels[item.metric] || item.metric}
                                  </span>
                                  <input
                                    type="number"
                                    min={0}
                                    value={item.points}
                                    onChange={(e) =>
                                      handleGradingChange(
                                        grading.findIndex(
                                          (g) => g.metric === item.metric
                                        ),
                                        e.target.value
                                      )
                                    }
                                    className="w-24 border border-gray-200 rounded px-3 py-1 focus:ring-2 focus:ring-blue-500 outline-none"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                    )}
                    <div className="text-center">
                      <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded transition w-full"
                      >
                        Save Configuration
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
            {/* Faculty List */}
            {selectedTab === "FacultyList" && (
              <Suspense fallback={<LoadingSpinner />}>
                <FacultyList />
              </Suspense>
            )}

            {/* HOD List */}
            {selectedTab === "HODList" && (
              <Suspense fallback={<LoadingSpinner />}>
                <HODList />
              </Suspense>
            )}

            {/* Contact Requests */}
            {selectedTab === "ContactRequests" && (
              <Suspense fallback={<LoadingSpinner />}>
                <ContactRequests />
              </Suspense>
            )}

            {/* Downloads */}
            {selectedTab === "Downloads" && (
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Download Data</h2>
                <p className="text-gray-500 mb-6">
                  Export various types of data from the system.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <button
                    onClick={() => handleDownload("all-students")}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <FiDownload className="text-blue-600" />
                      <h3 className="font-semibold">All Students Data</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      Same format as generate students excel
                    </p>
                  </button>

                  <button
                    onClick={() => handleDownload("faculty")}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <FiDownload className="text-green-600" />
                      <h3 className="font-semibold">Faculty Data</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      All faculty + department-wise sheets
                    </p>
                  </button>

                  <button
                    onClick={() => handleDownload("hod")}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <FiDownload className="text-purple-600" />
                      <h3 className="font-semibold">HOD Data</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      Head of Department information
                    </p>
                  </button>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <FiDownload className="text-red-600" />
                      <h3 className="font-semibold">Department Wise</h3>
                    </div>
                    <div className="space-y-2 mb-3">
                      <select
                        value={deptWiseFilter}
                        onChange={(e) => setDeptWiseFilter(e.target.value)}
                        className="w-full p-2 border rounded text-sm"
                      >
                        <option value="">Select Department</option>
                        {depts.map((d) => (
                          <option key={d.dept_code} value={d.dept_code}>
                            {d.dept_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={() => handleDownload("department-wise")}
                      className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 transition"
                    >
                      Download Department Data
                    </button>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <FiDownload className="text-teal-600" />
                      <h3 className="font-semibold">Custom Report</h3>
                    </div>
                    <div className="space-y-2 mb-3">
                      <select
                        value={customFilters.dept}
                        onChange={(e) =>
                          setCustomFilters((prev) => ({
                            ...prev,
                            dept: e.target.value,
                          }))
                        }
                        className="w-full p-2 border rounded text-sm"
                      >
                        <option value="">All Departments</option>
                        {depts.map((d) => (
                          <option key={d.dept_code} value={d.dept_code}>
                            {d.dept_name}
                          </option>
                        ))}
                      </select>
                      <div className="flex gap-2">
                        <select
                          value={customFilters.year}
                          onChange={(e) =>
                            setCustomFilters((prev) => ({
                              ...prev,
                              year: e.target.value,
                            }))
                          }
                          className="flex-1 p-2 border rounded text-sm"
                        >
                          <option value="">All Years</option>
                          {years.map((y) => (
                            <option key={y} value={y}>
                              {y}
                            </option>
                          ))}
                        </select>
                        <select
                          value={customFilters.section}
                          onChange={(e) =>
                            setCustomFilters((prev) => ({
                              ...prev,
                              section: e.target.value,
                            }))
                          }
                          className="flex-1 p-2 border rounded text-sm"
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
                    <button
                      onClick={() => handleDownload("custom")}
                      className="w-full bg-teal-600 text-white py-2 rounded hover:bg-teal-700 transition"
                    >
                      Generate Custom Report
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* User Management */}
            {selectedTab === "UserManagment" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 max-w-6xl mx-auto">
                {/* User Management */}
                <div className="bg-white shadow rounded-lg p-0 flex flex-col md:flex-row min-h-[340px] col-span-2">
                  {/* Left Menu */}
                  <div
                    className="md:w-1/4
                 bg-gray-50 p-4"
                  >
                    <h2 className="text-xl font-semibold mb-4">
                      User Management
                    </h2>
                    <ul className="space-y-2">
                      {[
                        { key: "addBranch", label: "Add Branch" }, // <-- Added here
                        { key: "addStudent", label: "Add Student" },
                        { key: "addFaculty", label: "Add Faculty" },
                        { key: "addHOD", label: "Add HOD" },
                        { key: "resetPassword", label: "Reset Password" },
                        { key: "bulkImport", label: "Bulk Import" },
                      ].map((item) => (
                        <li key={item.key}>
                          <button
                            className={`w-full text-left px-3 py-2 rounded transition ${
                              userMgmtTab === item.key
                                ? "bg-blue-600 text-white"
                                : "hover:bg-blue-100"
                            }`}
                            onClick={() => setUserMgmtTab(item.key)}
                          >
                            {item.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {/* Right Content */}
                  <div className="flex-1 p-6">
                    <Suspense fallback={<LoadingSpinner />}>
                      {userMgmtTab === "addStudent" && (
                        <AddIndividualStudentModel />
                      )}
                      {userMgmtTab === "addFaculty" && <AddFacultyModal />}
                      {userMgmtTab === "addHOD" && <AddHODModal />}
                      {userMgmtTab === "resetPassword" && (
                        <ResetPasswordModal />
                      )}
                      {userMgmtTab === "bulkImport" && <BulkImportModal />}
                      {userMgmtTab === "addBranch" && <AddBranchModal />}
                    </Suspense>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
export default AdminDashboard;
