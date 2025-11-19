import React, { useState, useEffect, useMemo } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Treemap,
  FunnelChart,
  Funnel,
  LabelList,
} from "recharts";
import {
  FiFilter,
  FiDownload,
  FiMaximize2,
  FiMinimize2,
  FiSettings,
  FiCalendar,
  FiBarChart2,
  FiPieChart,
  FiTrendingUp,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { useMeta } from "../../context/MetaContext";

const InteractiveDashboard = ({ data, title = "Interactive Analytics" }) => {
  const { depts, years, sections } = useMeta();
  const [filters, setFilters] = useState({
    dateRange: "30d",
    department: "all",
    platform: "all",
    metric: "score",
  });
  const [chartType, setChartType] = useState("bar");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Process data based on filters
  const filteredData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];

    let processed = [...data];

    // Apply department filter
    if (filters.department !== "all") {
      processed = processed.filter((item) => {
        return item.dept_name === filters.department || 
               item.dept_code === filters.department;
      });
    }

    // Apply platform filter
    if (filters.platform !== "all") {
      processed = processed.filter((item) => {
        const perf = item.performance?.platformWise;
        if (!perf) return false;

        switch (filters.platform) {
          case "leetcode":
            return perf.leetcode && (perf.leetcode.easy + perf.leetcode.medium + perf.leetcode.hard) > 0;
          case "codechef":
            return perf.codechef && perf.codechef.problems > 0;
          case "gfg":
            return perf.gfg && (perf.gfg.school + perf.gfg.basic + perf.gfg.easy + perf.gfg.medium + perf.gfg.hard) > 0;
          case "hackerrank":
            return perf.hackerrank && perf.hackerrank.badges > 0;
          default:
            return true;
        }
      });
    }

    return processed.slice(0, 50);
  }, [data, filters]);

  // Chart data transformations
  const chartData = useMemo(() => {
    return filteredData.map((item, index) => ({
      name: item.name?.split(" ")[0] || `Student ${index + 1}`,
      score: item.score || 0,
      totalSolved: item.performance?.combined?.totalSolved || 0,
      contests: item.performance?.combined?.totalContests || 0,
      rank: index + 1,
      department: item.dept_name,
    }));
  }, [filteredData]);

  // Radar chart data for top performers
  const radarData = useMemo(() => {
    const top5 = filteredData.slice(0, 5);
    return top5.map((student) => {
      const perf = student.performance?.platformWise;
      return {
        name: student.name?.split(" ")[0],
        LeetCode: perf?.leetcode
          ? perf.leetcode.easy + perf.leetcode.medium + perf.leetcode.hard
          : 0,
        CodeChef: perf?.codechef?.problems || 0,
        GeeksforGeeks: perf?.gfg
          ? perf.gfg.school +
            perf.gfg.basic +
            perf.gfg.easy +
            perf.gfg.medium +
            perf.gfg.hard
          : 0,
        HackerRank: perf?.hackerrank?.badges || 0,
      };
    });
  }, [filteredData]);

  const exportData = () => {
    const csvContent = [
      ["Name", "Score", "Total Solved", "Contests", "Department"],
      ...chartData.map((item) => [
        item.name,
        item.score,
        item.totalSolved,
        item.contests,
        item.department,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics_${filters.dateRange}_${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Data exported successfully!");
  };

  const ChartRenderer = () => {
    return (
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip />
          <Legend />
          <Bar yAxisId="left" dataKey="score" fill="#3B82F6" name="Score" />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="totalSolved"
            stroke="#10B981"
            strokeWidth={2}
            name="Problems Solved"
          />
        </ComposedChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-100 ${
        isFullscreen ? "fixed inset-0 z-50 m-4" : ""
      }`}
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <div className="flex items-center space-x-2">
            {/* Chart Type Selector */}
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="bar">Bar Chart</option>
            </select>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg ${
                showFilters
                  ? "bg-blue-100 text-blue-600"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <FiFilter className="w-4 h-4" />
            </button>

            {/* Export Button */}
            <button
              onClick={exportData}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <FiDownload className="w-4 h-4" />
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              {isFullscreen ? (
                <FiMinimize2 className="w-4 h-4" />
              ) : (
                <FiMaximize2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date Range
                </label>
                <select
                  value={filters.dateRange}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      dateRange: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department
                </label>
                <select
                  value={filters.department}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      department: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="all">All Departments</option>
                  {depts.map((dept) => (
                    <option key={dept.dept_code} value={dept.dept_code}>
                      {dept.dept_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Platform
                </label>
                <select
                  value={filters.platform}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      platform: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="all">All Platforms</option>
                  <option value="leetcode">LeetCode</option>
                  <option value="codechef">CodeChef</option>
                  <option value="gfg">GeeksforGeeks</option>
                  <option value="hackerrank">HackerRank</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Metric
                </label>
                <select
                  value={filters.metric}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, metric: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="score">Score</option>
                  <option value="problems">Problems Solved</option>
                  <option value="contests">Contests</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chart Content */}
      <div className="p-6">
        <ChartRenderer />

        {/* Data Summary */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {filteredData.length}
            </div>
            <div className="text-sm text-blue-600">Students</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {Math.round(
                chartData.reduce((sum, item) => sum + item.score, 0) /
                  chartData.length
              ) || 0}
            </div>
            <div className="text-sm text-green-600">Avg Score</div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default InteractiveDashboard;
