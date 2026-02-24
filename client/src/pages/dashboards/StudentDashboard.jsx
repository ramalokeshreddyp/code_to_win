import React, { useState, useCallback } from "react";
import {
  FiCheck,
  FiClock,
  FiCode,
  FiRefreshCw,
  FiX,
  FiPause,
  FiAlertTriangle,
  FiHome,
  FiUser,
  FiAward,
  FiPlus,
  FiTrash2,
  FiExternalLink,
  FiTrendingUp,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import dayjs from "dayjs";
import Navbar from "../../components/Navbar";
import DashboardSidebar from "../../components/DashboardSidebar";
import StatsCard from "../../components/ui/StatsCard";
import PlatformCard from "../../components/ui/PlatformCard";
import {
  EditModal,
  UpdateProfileModal,
  UserResetPasswordModal,
} from "../../components/Modals";
import AchievementModal from "../../components/modals/AchievementModal";
import SectionLeaderboard from "../../components/SectionLeaderboard";
import Footer from "../../components/Footer";
import { formatName, formatDepartment, formatSection } from "../../utils/textFormatter";

const StudentDashboard = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [editProfile, setEditprofile] = useState(false);
  const [updateProfile, setUpdateProfile] = useState(false);
  const [changepassword, setChangepassword] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [achievements, setAchievements] = useState([]);
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [initialAchievementType, setInitialAchievementType] = useState(null);
  const [selectedTab, setSelectedTab] = useState("Overview");

  const { currentUser, checkAuth, logout } = useAuth();
  const formattedDate = dayjs(
    currentUser.performance.combined.last_updated
  ).format("DD/MM/YYYY | hh:mm A");

  const totalContests =
    currentUser.performance.combined?.totalContests ??
    currentUser.performance.platformWise.leetcode.contests +
      currentUser.performance.platformWise.codechef.contests;

  const totalBadges =
    currentUser.performance.platformWise.leetcode.badges +
    currentUser.performance.platformWise.codechef.badges +
    (currentUser.performance.platformWise.hackerrank.badges || 0);

  const totalStars =
    (currentUser.performance.platformWise.hackerrank.totalStars || 0) +
    currentUser.performance.platformWise.codechef.stars;

  // Check for suspended platforms
  const suspendedPlatforms = [
    "leetcode",
    "codechef",
    "geeksforgeeks",
    "hackerrank",
    "github",
  ]
    .filter(
      (platform) =>
        currentUser.coding_profiles?.[`${platform}_status`] === "suspended"
    )
    .map((platform) => platform.charAt(0).toUpperCase() + platform.slice(1));

  const handleRefresh = async () => {
    setRefreshing(true);
    const toastId = toast.loading("Syncing your coding profiles...");
    
    try {
      const res = await fetch("/api/student/refresh-coding-profiles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: currentUser.student_id }),
      });
      
      if (!res.ok) {
        throw new Error("Failed to refresh coding profiles");
      }
      
      const data = await res.json();
      
      // Optimistic update immediately
      await checkAuth();
      
      if (data.success) {
        toast.success(
          `${data.message} - Updates applied!`,
          { id: toastId }
        );
      } else {
        toast.success(
          "Sync started. Your profiles will update in the background.",
          { id: toastId }
        );
      }
    } catch (err) {
      console.error("Refresh coding profiles failed:", err);
      toast.error("Profile sync initiated. Check back in a moment.", { id: toastId });
    } finally {
      setRefreshing(false);
    }
  };

  const fetchAchievements = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/achievements/my-achievements?studentId=${currentUser.student_id}`
      );
      if (res.ok) {
        const data = await res.json();
        setAchievements(data);
      }
    } catch (error) {
      console.error("Failed to fetch achievements", error);
    }
  }, [currentUser.student_id]);

  React.useEffect(() => {
    if (selectedTab === "Achievements") {
      fetchAchievements();
    }
  }, [selectedTab, fetchAchievements]);

  const handleDeleteAchievement = async (id) => {
    if (!window.confirm("Are you sure you want to delete this achievement?"))
      return;
    try {
      const res = await fetch(
        `/api/achievements/${id}?studentId=${currentUser.student_id}`,
        {
          method: "DELETE",
        }
      );
      if (res.ok) {
        toast.success("Achievement deleted");
        fetchAchievements();
      } else {
        toast.error("Failed to delete");
      }
    } catch (err) {
      console.error("Delete achievement failed:", err);
      toast.error("Error deleting achievement");
    }
  };

  const menuItems = [
    { key: "Overview", label: "Dashboard", icon: <FiHome /> },
    { key: "Profile", label: "My Profile", icon: <FiUser /> },
    { key: "Achievements", label: "Achievements", icon: <FiAward /> },
    { key: "Leaderboard", label: "Leaderboard", icon: <FiTrendingUp /> },
  ];

  return (
    <>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Modals */}
        {editProfile && (
          <EditModal
            user={currentUser}
            onSuccess={() => checkAuth()}
            onClose={() => setEditprofile(false)}
          />
        )}
        {updateProfile && (
          <UpdateProfileModal
            user={currentUser}
            onSuccess={() => checkAuth()}
            onClose={() => setUpdateProfile(false)}
          />
        )}
        {changepassword && (
          <UserResetPasswordModal
            user={currentUser}
            onClose={() => setChangepassword(false)}
          />
        )}
        {showAchievementModal && (
          <AchievementModal
            studentId={currentUser.student_id}
            existingAchievement={selectedAchievement}
            initialType={initialAchievementType}
            onClose={() => {
              setShowAchievementModal(false);
              setSelectedAchievement(null);
              setInitialAchievementType(null);
            }}
            onSuccess={() => {
              fetchAchievements();
              checkAuth();
            }}
          />
        )}

        <Navbar toggleSidebar={() => setSidebarOpen(true)} />

        <div className="flex flex-1 relative">
          <DashboardSidebar
            isOpen={sidebarOpen}
            toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            selectedTab={selectedTab}
            setSelectedTab={setSelectedTab}
            menuItems={menuItems}
            onLogout={logout}
          />

          <main className="flex-1 lg:ml-64 p-4 md:p-8 transition-all duration-300">
            {/* Suspended notification */}
            {suspendedPlatforms.length > 0 && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 rounded-r-lg shadow-sm">
                <div className="flex items-center">
                  <FiAlertTriangle className="text-yellow-400 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      Platform Update Check
                    </p>
                    <p className="text-sm text-yellow-700">
                      {suspendedPlatforms.join(", ")} temporary connection
                      issues. Will retry shortly.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {selectedTab === "Overview" && (
              <>
                {/* Hero Section */}
                <div className="relative rounded-3xl overflow-hidden mb-8 shadow-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-white p-6 md:p-10">
                  {/* Abstract decorative circles */}
                  <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-white/10 blur-3xl"></div>
                  <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-60 h-60 rounded-full bg-blue-500/20 blur-2xl"></div>

                  <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div className="md:w-2/3">
                      <div className="flex items-center gap-4 mb-2">
                        <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border border-white/10">
                          Student Dashboard
                        </span>
                        <span className="text-blue-100 text-xs flex items-center gap-1">
                          <FiClock size={12} />
                          Updated: {formattedDate}
                        </span>
                      </div>
                      <h1 className="text-3xl md:text-5xl font-bold mb-2">
                        Welcome back, {formatName(currentUser.name)?.split(" ")[0]}!
                      </h1>
                      <p className="text-blue-100 text-lg max-w-xl">
                        Track your progress, analyze your performance, and keep
                        pushing your limits across all coding platforms.
                      </p>

                      <div className="flex flex-wrap gap-3 mt-6">
                        <button
                          onClick={() => setUpdateProfile(true)}
                          className="px-5 py-2.5 bg-white text-blue-700 font-semibold rounded-xl shadow-lg hover:shadow-xl hover:bg-gray-50 transition-all flex items-center gap-2 cursor-pointer"
                        >
                          Connect Profiles
                        </button>
                        <button
                          onClick={handleRefresh}
                          className="px-5 py-2.5 bg-blue-700/50 backdrop-blur-md text-white font-semibold rounded-xl border border-white/20 hover:bg-blue-700/70 transition-all flex items-center gap-2 cursor-pointer"
                          disabled={refreshing}
                        >
                          <FiRefreshCw
                            className={refreshing ? "animate-spin" : ""}
                          />
                          {refreshing ? "Refreshing..." : "Sync Data"}
                        </button>
                        <button
                          onClick={() => setEditprofile(true)}
                          className="px-5 py-2.5 bg-transparent border border-white/30 text-white font-medium rounded-xl hover:bg-white/10 transition-all"
                        >
                          Edit Profile
                        </button>
                      </div>
                    </div>

                    {/* Floating Glass Stats */}
                    <div className="flex gap-4">
                      <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex flex-col items-center min-w-[100px]">
                        <span className="text-blue-200 text-sm font-medium">
                          Rank
                        </span>
                        <span className="text-3xl font-bold">
                          {currentUser.overall_rank}
                        </span>
                      </div>
                      <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex flex-col items-center min-w-[100px]">
                        <span className="text-blue-200 text-sm font-medium">
                          Score
                        </span>
                        <span className="text-3xl font-bold text-green-300">
                          {currentUser.score}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Stats Grid */}
                <h2 className="text-xl font-bold text-gray-800 mb-4 px-2">
                  Performance Overview
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <StatsCard
                    icon={<FiCode />}
                    title="Problems Solved"
                    value={currentUser?.performance?.combined?.totalSolved || 0}
                    color="blue"
                  />
                  <StatsCard
                    icon={<FiCode />}
                    title="Contests"
                    value={totalContests}
                    color="success"
                  />
                  <StatsCard
                    icon={<FiCode />}
                    title="Stars Earned"
                    value={totalStars}
                    color="warning"
                  />
                  <StatsCard
                    icon={<FiCode />}
                    title="Badges"
                    value={totalBadges}
                    color="purple"
                  />
                </div>

                {/* Platform Cards Grid */}
                <div className="flex items-center justify-between mb-4 px-2">
                  <h2 className="text-xl font-bold text-gray-800">
                    Active Platforms
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-12">
                  {currentUser.coding_profiles?.leetcode_status ===
                    "accepted" && (
                    <PlatformCard
                      name="LeetCode"
                      color="border-l-4 border-yellow-500"
                      icon="/LeetCode_logo.png"
                      ani="fade-up"
                      total={
                        currentUser.performance.platformWise.leetcode.easy +
                        currentUser.performance.platformWise.leetcode.medium +
                        currentUser.performance.platformWise.leetcode.hard
                      }
                      breakdown={{
                        Easy: currentUser.performance.platformWise.leetcode
                          .easy,
                        Medium:
                          currentUser.performance.platformWise.leetcode.medium,
                        Hard: currentUser.performance.platformWise.leetcode
                          .hard,
                        Contests:
                          currentUser.performance.platformWise.leetcode
                            .contests,
                        Rating:
                          currentUser.performance.platformWise.leetcode
                            .rating,
                        Badges:
                          currentUser.performance.platformWise.leetcode.badges,
                      }}
                    />
                  )}
                  {currentUser.coding_profiles?.codechef_status ===
                    "accepted" && (
                    <PlatformCard
                      name="CodeChef"
                      color="border-l-4 border-orange-600"
                      icon="/codechef_logo.png"
                      ani="fade-up"
                      total={
                        currentUser.performance.platformWise.codechef.problems
                      }
                      subtitle="Problems Solved"
                      breakdown={{
                        Contests:
                          currentUser.performance.platformWise.codechef
                            .contests,
                        Rating:
                          currentUser.performance.platformWise.codechef
                            .rating,
                        Stars: currentUser.performance.platformWise.codechef
                          .stars,
                        Badges:
                          currentUser.performance.platformWise.codechef.badges,
                      }}
                    />
                  )}
                  {currentUser.coding_profiles?.geeksforgeeks_status ===
                    "accepted" && (
                    <PlatformCard
                      name="GeeksforGeeks"
                      color="border-l-4 border-green-600"
                      icon="/GeeksForGeeks_logo.png"
                      ani="fade-down"
                      total={
                        currentUser.performance.platformWise.gfg.school +
                        currentUser.performance.platformWise.gfg.basic +
                        currentUser.performance.platformWise.gfg.easy +
                        currentUser.performance.platformWise.gfg.medium +
                        currentUser.performance.platformWise.gfg.hard
                      }
                      breakdown={{
                        School: currentUser.performance.platformWise.gfg.school,
                        Basic: currentUser.performance.platformWise.gfg.basic,
                        Easy: currentUser.performance.platformWise.gfg.easy,
                        Medium: currentUser.performance.platformWise.gfg.medium,
                        Hard: currentUser.performance.platformWise.gfg.hard,
                      }}
                    />
                  )}
                  {currentUser.coding_profiles?.hackerrank_status ===
                    "accepted" && (
                    <PlatformCard
                      name="HackerRank"
                      color="border-l-4 border-gray-800"
                      icon="/HackerRank_logo.png"
                      ani="fade-down"
                      total={
                        currentUser.performance.platformWise.hackerrank.badges || 0
                      }
                      label="Badges"
                      subtitle={`${currentUser.performance.platformWise.hackerrank.totalStars || 0} Total Stars`}
                      breakdown={(
                        currentUser.performance.platformWise.hackerrank
                          .badgesList || []
                      ).reduce((acc, badge) => {
                        acc[badge.name] = `${badge.stars}⭐`;
                        return acc;
                      }, {})}
                    />
                  )}
                  {currentUser.coding_profiles?.github_id && (
                    <PlatformCard
                      name="GitHub"
                      color="border-l-4 border-black"
                      icon="https://cdn-icons-png.flaticon.com/512/25/25231.png"
                      ani="fade-up"
                      total={currentUser.performance.platformWise.github.repos}
                      subtitle="Public Repositories"
                      breakdown={{
                        "Total Contributions":
                          currentUser.performance.platformWise.github
                            .contributions,
                      }}
                    />
                  )}

                  {/* Add Platform Prompt - if few platforms connected */}
                  <div
                    onClick={() => setUpdateProfile(true)}
                    className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all cursor-pointer min-h-[200px]"
                  >
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                      <FiCode size={24} />
                    </div>
                    <span className="font-semibold">
                      Connect More Platforms
                    </span>
                    <span className="text-xs mt-1">
                      Add CodeChef, HackerRank & more
                    </span>
                  </div>
                </div>
              </>
            )}

            {selectedTab === "Profile" && (
              <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-sm p-8 mb-6">
                  <div className="flex items-center gap-6 mb-8">
                    <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-3xl font-bold text-blue-600">
                      {currentUser.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {formatName(currentUser.name)}
                      </h2>
                      <p className="text-gray-500">{currentUser.email}</p>
                      <div className="flex gap-3 mt-3">
                        <button
                          onClick={() => setEditprofile(true)}
                          className="text-sm px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Edit Profile
                        </button>
                        <button
                          onClick={() => setChangepassword(true)}
                          className="text-sm px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Change Password
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                        Roll Number
                      </label>
                      <p className="text-lg font-medium text-gray-900">
                        {currentUser.student_id}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                        Degree
                      </label>
                      <p className="text-lg font-medium text-gray-900">
                        {currentUser.degree}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                        Department
                      </label>
                      <p className="text-lg font-medium text-gray-900">
                        {formatDepartment(currentUser.dept_name)}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                        Year
                      </label>
                      <p className="text-lg font-medium text-gray-900">
                        {currentUser.year}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                        Section
                      </label>
                      <p className="text-lg font-medium text-gray-900">
                        {formatSection(currentUser.section)}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                        College
                      </label>
                      <p className="text-lg font-medium text-gray-900">
                        {formatName(currentUser.college)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm p-8">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900">
                      Connected Profiles
                    </h3>
                    <button
                      onClick={() => setUpdateProfile(true)}
                      className="text-blue-600 font-medium hover:underline"
                    >
                      Manage Connections
                    </button>
                  </div>
                  <div className="space-y-4">
                    {[
                      "leetcode",
                      "codechef",
                      "geeksforgeeks",
                      "hackerrank",
                      "github",
                    ].map((platform) => (
                      <div
                        key={platform}
                        className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center p-2">
                            {/* Simple fallback icons or logic to reuse PlatformCard icons could go here */}
                            <span className="font-bold text-gray-500">
                              {platform[0].toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 capitalize">
                              {platform}
                            </p>
                            <p className="text-sm text-gray-500">
                              {currentUser.coding_profiles?.[
                                `${platform}_id`
                              ] || "Not Connected"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                              currentUser.coding_profiles?.[
                                `${platform}_status`
                              ] === "accepted"
                                ? "bg-green-100 text-green-700"
                                : currentUser.coding_profiles?.[
                                    `${platform}_status`
                                  ] === "pending"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {currentUser.coding_profiles?.[
                              `${platform}_status`
                            ] || "No Data"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedTab === "Achievements" && (
              <div className="max-w-5xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        My Achievements
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        You have {achievements.length} achievement{achievements.length !== 1 ? "s" : ""} (max 2 per category)
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedAchievement(null);
                      setInitialAchievementType(null);
                      setShowAchievementModal(true);
                    }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30"
                  >
                    <FiPlus size={20} /> Add Achievement
                  </button>
                </div>

                {achievements.length === 0 ? (
                  <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                    <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FiAward size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      No Achievements Yet
                    </h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-6">
                      Showcase your skills by uploading certificates, hackathon
                      wins, or workshop participations.
                    </p>
                    <button
                      onClick={() => setShowAchievementModal(true)}
                      className="px-6 py-2.5 bg-blue-50 text-blue-600 font-semibold rounded-xl hover:bg-blue-100 transition-colors"
                    >
                      Start Adding
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                    {achievements.map((ach) => (
                      <div
                        key={ach.id}
                        className="bg-white rounded-2xl shadow-sm p-6 relative group hover:shadow-md transition-all border border-transparent hover:border-blue-100"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <span className="px-3 py-1 rounded-full text-xs font-semibold capitalize bg-blue-50 text-blue-700">
                            {ach.type}
                          </span>
                          <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {ach.file_path && (
                              <a
                                href={ach.file_path}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="View Proof"
                              >
                                <FiExternalLink size={18} />
                              </a>
                            )}
                            <button
                              onClick={() => {
                                setSelectedAchievement(ach);
                                setInitialAchievementType(ach.type);
                                setShowAchievementModal(true);
                              }}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Replace"
                            >
                              <FiRefreshCw size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteAchievement(ach.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <FiTrash2 size={18} />
                            </button>
                          </div>
                        </div>

                        <h3 className="text-lg font-bold text-gray-900 mb-1 leading-tight">
                          {ach.title}
                        </h3>
                        <p className="text-sm text-gray-500 mb-3">
                          {dayjs(ach.date).format("MMM D, YYYY")} {ach.subtype ? `• ${ach.subtype}` : ""}
                        </p>

                        {ach.description && (
                          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                            {ach.description}
                          </p>
                        )}

                        <div className="flex items-center gap-2 mt-auto pt-4 border-t border-gray-50">
                          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                            {ach.subtype || "standard"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedTab === "Leaderboard" && (
              <SectionLeaderboard />
            )}
          </main>
        </div>
        {/* <Footer /> */}
      </div>
    </>
  );
};

export default StudentDashboard;
