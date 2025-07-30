import React, { useState } from "react";
import {
  FiCheck,
  FiClock,
  FiCode,
  FiRefreshCw,
  FiX,
  FiPause,
  FiAlertTriangle,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { useAuth } from "../../context/AuthContext";
import dayjs from "dayjs";
import Navbar from "../../components/Navbar";
import StatsCard from "../../components/ui/StatsCard";
import PlatformCard from "../../components/ui/PlatformCard";
import {
  EditModal,
  UpdateProfileModal,
  UserResetPasswordModal,
} from "../../components/Modals";
import Footer from "../../components/Footer";
const StudentDashboard = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [editProfile, setEditprofile] = useState(false);
  const [updateProfile, setUpdateProfile] = useState(false);
  const [changepassword, setChangepassword] = useState(false);
  const { currentUser, checkAuth } = useAuth();
  const formattedDate = dayjs(
    currentUser.performance.combined.last_updated
  ).format("DD/MM/YYYY | hh:mm A");
  const totalContests =
    currentUser.performance.platformWise.leetcode.contests +
    currentUser.performance.platformWise.codechef.contests;

  const totalBadges =
    currentUser.performance.platformWise.leetcode.badges +
    currentUser.performance.platformWise.codechef.badges;

  const totalStars =
    currentUser.performance.platformWise.hackerrank.badges +
    currentUser.performance.platformWise.codechef.stars;

  // Check for suspended platforms
  const suspendedPlatforms = [
    "leetcode",
    "codechef",
    "geeksforgeeks",
    "hackerrank",
  ]
    .filter(
      (platform) =>
        currentUser.coding_profiles?.[`${platform}_status`] === "suspended"
    )
    .map((platform) => platform.charAt(0).toUpperCase() + platform.slice(1));

  const handleRefresh = async () => {
    setRefreshing(true);
    const toastId = toast.loading("Refreshing coding profiles...");
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
      await checkAuth();
      toast.success(
        "Coding profiles refreshed! Please wait a moment for updates.",
        { id: toastId }
      );
    } catch (err) {
      toast.error("Failed to refresh coding profiles.", { id: toastId });
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <>
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
      <Navbar />

      <div className=" bg-gray-100/50 p-6 lg:px-10 xl:px-40">
        {/* Suspended Platforms Notification */}
        {suspendedPlatforms.length > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 rounded">
            <div className="flex items-center">
              <FiAlertTriangle className="text-yellow-400 mr-2" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Platform Update Issues
                </p>
                <p className="text-sm text-yellow-700">
                  {suspendedPlatforms.join(", ")} temporarily suspended due to
                  connection issues. We'll retry automatically.
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="text-right text-sm text-gray-500 mb-2">
          Last Updated on {formattedDate}
        </div>
        {/* Cover Section */}
        <div className="w-full h-52 bg-gradient-to-r from-pink-200 via-orange-100 to-teal-100 rounded-t-xl relative overflow-hidden">
          <img
            src="/profile_bg.jpeg"
            alt="Background"
            className="w-full h-full object-cover opacity-70"
          />
        </div>

        {/* Profile Section */}
        <div className="p-4 flex md:flex-row flex-col gap-4">
          {/* Sidebar */}
          <div
            className="bg-white rounded-xl shadow-lg p-6  lg:max-w-sm h-fit -mt-24 z-20"
            data-aos="fade-out"
          >
            <div className="flex flex-r items-center mb-4">
              <div className="bg-blue-100 text-blue-800 rounded-lg w-24 h-24 flex  items-center text-4xl justify-center font-bold">
                {currentUser.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              {/* <img
                src="/profile_bg.jpeg"
                alt="sunil"
                className="object-cover w-24 h-24 rounded  mb-2"
              /> */}
              <div className="ml-3">
                <h2 className="text-lg font-bold">{currentUser.name}</h2>
                <div className="flex gap-10">
                  <div>
                    <p className="text-sm text-gray-500 font-semibold  mt-2">
                      University Rank
                    </p>
                    <p className="text-xl font-semibold text-gray-800">
                      {currentUser.overall_rank}
                    </p>
                  </div>
                  <div className="bg-green-200 rounded-full font-semibold md:w-16 md:h-16  w-14 h-14 flex flex-col items-center p-3 justify-center">
                    <p className="text-sm text-gray-500  ">Score</p>

                    <p className="md:text-lg text-base  text-gray-900">
                      {currentUser.score}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <hr className="my-4" />
            <div className="text-justify space-y-4">
              <button
                onClick={() => setEditprofile(true)}
                className="text-blue-600 underline float-end cursor-pointer"
              >
                Edit
              </button>

              <p className="font-semibold">Personal Information</p>

              <p className="flex  justify-between">
                <span className="font-semibold text-left line-clamp-3">
                  Name:
                </span>{" "}
                {currentUser.name}
              </p>
              <p className="flex justify-between">
                <span className="font-semibold text-left">Roll No:</span>{" "}
                {currentUser.student_id}
              </p>
              <p className="flex justify-between">
                <span className="font-semibold text-left">Email:</span>{" "}
                <span className="inline-block  text-end w-2/3 truncate">
                  {currentUser.email}
                </span>
              </p>
              <button
                onClick={() => setChangepassword(true)}
                className="text-blue-600 underline text-sm float-right cursor-pointer mb-2"
              >
                changepassword
              </button>
            </div>
            <hr className="my-4 w-full" />
            <div className="text-justify space-y-4">
              <button
                onClick={() => setUpdateProfile(true)}
                className="text-blue-600 underline float-end cursor-pointer"
              >
                Update Profiles
              </button>

              <p className="font-semibold">Coding Profiles</p>

              <div className="flex flex-col gap-2">
                {["leetcode", "codechef", "geeksforgeeks", "hackerrank"].map(
                  (platform) => {
                    const idKey = `${platform}_id`;
                    const statusKey = `${platform}_status`;
                    const username =
                      currentUser.coding_profiles?.[idKey] || "Not Provided";
                    const status = currentUser.coding_profiles?.[statusKey];
                    return (
                      <div
                        key={platform}
                        className="flex justify-between items-center"
                      >
                        <span className="font-semibold text-left••••••••••••••">
                          {platform.charAt(0).toUpperCase() + platform.slice(1)}
                        </span>
                        <p className="text-gray-500 text-end inline-block  truncate ">
                          <span className="inline-block w-1/2 truncate text-end">
                            {username}
                          </span>
                          {status === "accepted" && (
                            <FiCheck className="inline ml-1 -mt-3 text-green-500" />
                          )}
                          {status === "rejected" && (
                            <FiX className="inline ml-1 -mt-3 text-red-500" />
                          )}
                          {status === "pending" && (
                            <FiClock className="inline ml-1 -mt-3 text-gray-500" />
                          )}
                          {status === "suspended" && (
                            <FiPause className="inline ml-1 -mt-3 text-yellow-500" />
                          )}
                        </p>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </div>

          {/* Main Section */}
          <div className="w-full rounded-xl">
            <div className="md:flex justify-between items-center">
              <div className="flex flex-wrap  gap-1">
                <span className="px-4 py-2 bg-white rounded-xl shadow-sm">
                  Campus:{" "}
                  <span className="font-semibold">{currentUser.college}</span>
                </span>
                <span className="px-4 py-2 bg-white rounded-xl shadow-sm">
                  Degree:{" "}
                  <span className="font-semibold">{currentUser.degree}</span>
                </span>

                <span className="px-4 py-2 bg-white rounded-xl shadow-sm">
                  Department:{" "}
                  <span className="font-semibold">{currentUser.dept_name}</span>
                </span>
                <span className="px-4 py-2 bg-white rounded-xl shadow-sm">
                  Year:{" "}
                  <span className="font-semibold">{currentUser.year}</span>
                </span>
                <span className="px-4 py-2 bg-white rounded-xl shadow-sm">
                  Section:{" "}
                  <span className="font-semibold">{currentUser.section}</span>
                </span>
              </div>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-white rounded-xl shadow-sm flex items-center gap-3 cursor-pointer mt-2 mb-2 md:mt-0 md:mb-0"
                disabled={refreshing}
              >
                <FiRefreshCw className={refreshing ? "animate-spin" : ""} />
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
            </div>
            {/* Stats Cards */}
            <div className="grid grid-cols-2 mb-4 xl:grid-cols-4 gap-3 md:border-0 border border-gray-200 p-4 rounded-xl ">
              <StatsCard
                icon={<FiCode />}
                title="Problems"
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
                title="Stars"
                value={totalStars}
                color="warning"
              />
              <StatsCard
                icon={<FiCode />}
                title="Badges"
                value={totalBadges}
                color="error"
              />
            </div>

            {/* Platform-wise Stats - Only show accepted platforms */}
            <div className="grid grid-cols-2 gap-2 md:gap-6 ">
              {currentUser.coding_profiles?.leetcode_status === "accepted" && (
                <PlatformCard
                  name="LeetCode"
                  color=" hover:text-yellow-600 hover:shadow-yellow-600"
                  icon="/LeetCode_logo.png"
                  ani="fade-up"
                  total={
                    currentUser.performance.platformWise.leetcode.easy +
                    currentUser.performance.platformWise.leetcode.medium +
                    currentUser.performance.platformWise.leetcode.hard
                  }
                  breakdown={{
                    Easy: currentUser.performance.platformWise.leetcode.easy,
                    Medium:
                      currentUser.performance.platformWise.leetcode.medium,
                    Hard: currentUser.performance.platformWise.leetcode.hard,
                    contests:
                      currentUser.performance.platformWise.leetcode.contests,
                    Badges:
                      currentUser.performance.platformWise.leetcode.badges,
                  }}
                />
              )}
              {currentUser.coding_profiles?.codechef_status === "accepted" && (
                <PlatformCard
                  name="CodeChef"
                  color=" hover:text-orange-900 hover:shadow-orange-900"
                  icon="/codechef_logo.png"
                  ani="fade-up"
                  total={currentUser.performance.platformWise.codechef.contests}
                  subtitle="Contests Participated"
                  breakdown={{
                    "Problems Solved":
                      currentUser.performance.platformWise.codechef.problems,
                    Star: currentUser.performance.platformWise.codechef.stars,
                    Badges:
                      currentUser.performance.platformWise.codechef.badges,
                  }}
                />
              )}
              {currentUser.coding_profiles?.geeksforgeeks_status ===
                "accepted" && (
                <PlatformCard
                  name="GeeksforGeeks"
                  color=" hover:text-green-800 hover:shadow-green-800"
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
                  color=" hover:text-gray-900 hover:shadow-gray-900"
                  icon="/HackerRank_logo.png"
                  ani="fade-down"
                  total={currentUser.performance.platformWise.hackerrank.badges}
                  subtitle="Stars Gained"
                  // breakdown={{
                  //   Badges: (currentUser.performance.platformWise.hackerrank.badgesList || [])
                  //     .map(badge => `${badge.name}: ${badge.stars}★`)
                  //     .join(", ")
                  // }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default StudentDashboard;
