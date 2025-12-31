import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { useMeta } from "../../context/MetaContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar,
} from "recharts";
import {
  FiUsers,
  FiTrendingUp,
  FiActivity,
  FiEye,
  FiClock,
  FiAward,
  FiCode,
  FiTarget,
  FiGlobe,
  FiRefreshCw,
  FiDownload,
  FiFilter,
} from "react-icons/fi";
import toast from "react-hot-toast";
import RealTimeDashboard from "../../components/ui/RealTimeDashboard";
import InteractiveDashboard from "../../components/ui/InteractiveDashboard";
import SystemHealthMonitor from "../../components/ui/SystemHealthMonitor";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
];

const AdminAnalyticsDashboard = () => {
  const { currentUser } = useAuth();
  const { depts } = useMeta();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState({});
  const [timeRange, setTimeRange] = useState("7d");
  const [selectedDept, setSelectedDept] = useState("all");

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange, selectedDept]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const [studentsRes, performanceRes, visitorRes, platformRes, rankingRes] =
        await Promise.all([
          fetch("/api/admin/analytics/students"),
          fetch("/api/admin/analytics/performance"),
          fetch("/api/admin/analytics/visitors"),
          fetch("/api/admin/analytics/platforms"),
          fetch("/api/ranking/overall?limit=100"),
        ]);

      const [students, performance, visitors, platforms, rankings] =
        await Promise.all([
          studentsRes.json(),
          performanceRes.json(),
          visitorRes.json(),
          platformRes.json(),
          rankingRes.json(),
        ]);

      setAnalyticsData({
        students,
        performance,
        visitors,
        platforms,
        rankings,
      });
    } catch (error) {
      toast.error("Failed to load analytics data");
      console.error("Analytics error:", error);
    }
    setLoading(false);
  };

  // Process data for visualizations
  const processedData = useMemo(() => {
    if (!analyticsData.students) return {};

    // Department distribution
    const deptDistribution = depts.map((dept) => ({
      name: dept.dept_name,
      value:
        currentUser.students_per_dept?.find(
          (d) => d.dept_name === dept.dept_name
        )?.student_count || 0,
    }));

    // Performance trends
    const performanceTrends =
      analyticsData.rankings?.slice(0, 20).map((student, index) => ({
        name: student.name.split(" ")[0],
        score: student.score || 0,
        rank: index + 1,
        totalSolved: student.performance?.combined?.totalSolved || 0,
      })) || [];

    // Platform usage
    const platformUsage = [
      { name: "LeetCode", active: 0, total: 0 },
      { name: "CodeChef", active: 0, total: 0 },
      { name: "GeeksforGeeks", active: 0, total: 0 },
      { name: "HackerRank", active: 0, total: 0 },
      { name: "GitHub", active: 0, total: 0 },
    ];

    analyticsData.rankings?.forEach((student) => {
      const perf = student.performance?.platformWise;
      if (perf) {
        if (
          perf.leetcode?.easy + perf.leetcode?.medium + perf.leetcode?.hard >
          0
        ) {
          platformUsage[0].active++;
        }
        if (perf.codechef?.problems > 0) {
          platformUsage[1].active++;
        }
        if (
          perf.gfg?.school +
            perf.gfg?.basic +
            perf.gfg?.easy +
            perf.gfg?.medium +
            perf.gfg?.hard >
          0
        ) {
          platformUsage[2].active++;
        }
        if (perf.hackerrank?.badges > 0) {
          platformUsage[3].active++;
        }
        if (perf.github?.repos > 0) {
          platformUsage[4].active++;
        }
      }
    });

    platformUsage.forEach((platform) => {
      platform.total = analyticsData.rankings?.length || 0;
      platform.percentage =
        platform.total > 0
          ? ((platform.active / platform.total) * 100).toFixed(1)
          : 0;
    });

    return {
      deptDistribution,
      performanceTrends,
      platformUsage,
    };
  }, [analyticsData, currentUser, depts]);

  const StatCard = ({
    icon,
    title,
    value,
    subtitle,
    color = "blue",
    trend,
  }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className={`p-3 rounded-lg bg-${color}-50`}>
          <div className={`text-${color}-600 text-xl`}>{icon}</div>
        </div>
        {trend && (
          <div
            className={`flex items-center text-sm ${
              trend > 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            <FiTrendingUp className="mr-1" />
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="mt-4">
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        <p className="text-sm text-gray-600 mt-1">{title}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FiRefreshCw className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Analytics Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                Comprehensive insights into platform performance
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              <button
                onClick={fetchAnalyticsData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
              >
                <FiRefreshCw className="mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Real-Time Dashboard */}
        <div className="mb-8">
          <RealTimeDashboard currentUser={currentUser} />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 gap-6 mb-8">
          {/* Department Distribution */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Department Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={processedData.deptDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {processedData.deptDistribution?.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Interactive Dashboard */}
        <div className="mb-8">
          <InteractiveDashboard
            data={analyticsData.rankings}
            title="Advanced Performance Analytics"
          />
        </div>

        {/* System Health Monitor */}
        <div className="mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              System Health & Performance
            </h3>
            <SystemHealthMonitor />
          </div>
        </div>

        {/* Detailed Analytics Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Student Performance Overview
              </h3>
              <div className="flex items-center space-x-4">
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="all">All Departments</option>
                  {depts.map((dept) => (
                    <option key={dept.dept_code} value={dept.dept_code}>
                      {dept.dept_name}
                    </option>
                  ))}
                </select>
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center text-sm">
                  <FiDownload className="mr-2" />
                  Export
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Problems Solved
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Platforms
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analyticsData.rankings?.slice(0, 50).map((student, index) => (
                  <tr key={student.student_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                            index < 3
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {index + 1}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {student.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {student.student_id}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.dept_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {student.score || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.performance?.combined?.totalSolved || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-1">
                        {student.performance?.platformWise?.leetcode && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                            LC
                          </span>
                        )}
                        {student.performance?.platformWise?.codechef && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                            CC
                          </span>
                        )}
                        {student.performance?.platformWise?.gfg && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                            GFG
                          </span>
                        )}
                        {student.performance?.platformWise?.hackerrank && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                            HR
                          </span>
                        )}
                        {student.performance?.platformWise?.github && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                            GH
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalyticsDashboard;
