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
} from "react-icons/fi";

// Lazy-loaded components
const RankingTable = lazy(() => import("../../components/Ranking"));
const ViewProfile = lazy(() => import("../../components/ViewProfile"));
const ContactRequests = lazy(() =>
  import("../../components/ui/ContactRequests")
);
const FacultyList = lazy(() => import("../../components/ui/FacultyList"));
const HODList = lazy(() => import("../../components/ui/HODList"));
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
};

const platformOrder = ["LeetCode", "GeeksforGeeks", "CodeChef", "HackerRank"];

function AdminDashboard() {
  const { currentUser, logout } = useAuth();
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedTab, setSelectedTab] = useState("StudentRanking");
  const [grading, setGrading] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userMgmtTab, setUserMgmtTab] = useState("addBranch");
  const [changedMetrics, setChangedMetrics] = useState(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { key: "StudentRanking", label: "Student Ranking", icon: <FiBarChart2 /> },
    { key: "FacultyList", label: "Faculty List", icon: <FiUsers /> },
    { key: "HODList", label: "HOD List", icon: <FiUserCheck /> },
    { key: "GradingSystem", label: "Grading System", icon: <FiSettings /> },
    { key: "UserManagment", label: "User Management", icon: <FiUserPlus /> },
    { key: "ContactRequests", label: "Contact Requests", icon: <FiMail /> },
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

  const handleComplete = (result) => {
    console.log("Processing complete:", result);
    // You can do something with the result here
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
            <UserProfile user={currentUser} />

            {/* Section Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
            </div>
            {/* Student Ranking */}
            {selectedTab === "StudentRanking" && (
              <Suspense fallback={<LoadingSpinner />}>
                <RankingTable filter={true} />
              </Suspense>
            )}
            {/* Grading System */}
            {selectedTab === "GradingSystem" && (
              <div className="bg-white px-4 py-8">
                <h1 className="text-2xl font-bold text-center mb-6">
                  Grading Configuration
                </h1>
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
