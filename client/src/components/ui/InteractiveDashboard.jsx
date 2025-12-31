import React, { useState, useEffect } from "react";
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
} from "recharts";
import { FiFilter, FiDownload, FiMaximize2, FiMinimize2 } from "react-icons/fi";
import toast from "react-hot-toast";
import { useMeta } from "../../context/MetaContext";

const InteractiveDashboard = ({
  data = [],
  title = "Interactive Analytics",
}) => {
  const { depts, years, sections } = useMeta();
  const [filters, setFilters] = useState({
    year: "all",
    department: "all",
    section: "all",
  });

  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [availableSections, setAvailableSections] = useState([]);

  // Fetch sections when Dept or Year changes
  useEffect(() => {
    const fetchSections = async () => {
      // Don't fetch if dependencies are not selected
      if (filters.department === "all" || filters.year === "all") {
        setAvailableSections([]);
        // Reset section filter if it was set
        if (filters.section !== "all") {
          setFilters((prev) => ({ ...prev, section: "all" }));
        }
        return;
      }

      try {
        const params = new URLSearchParams();
        params.append("dept", filters.department);
        params.append("year", filters.year);

        const res = await fetch(`/api/meta/sections?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setAvailableSections(Array.isArray(data) ? data : []);
        } else {
          setAvailableSections([]);
        }
      } catch (error) {
        console.error("Failed to fetch sections:", error);
        setAvailableSections([]);
      }
    };

    fetchSections();
  }, [filters.department, filters.year]);

  // Fetch data when filters change
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Map frontend filter state to backend query params
        const params = new URLSearchParams();

        if (filters.department !== "all")
          params.append("dept", filters.department);
        if (filters.year !== "all") params.append("year", filters.year);
        if (filters.section !== "all")
          params.append("section", filters.section);

        const res = await fetch(
          `/api/admin/analytics/performance-graph?${params.toString()}`
        );
        if (res.ok) {
          const result = await res.json();
          setChartData(result);
        }
      } catch (error) {
        console.error("Graph fetch error", error);
      }
      setLoading(false);
    };

    fetchData();
  }, [filters]);

  const exportData = () => {
    if (!chartData.length) return;

    const csvContent = [
      [
        "Name",
        "Score",
        "Rank",
        "Department",
        "Solved",
        "Contests",
        "Last Updated",
      ],
      ...chartData.map((item) => [
        item.name,
        item.score,
        item.overall_rank,
        item.department,
        item.totalSolved,
        item.contests,
        new Date(item.last_updated).toLocaleDateString(),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `performance_analytics_${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Data exported successfully!");
  };

  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-100 ${
        isFullscreen ? "fixed inset-0 z-50 m-4 overflow-auto" : ""
      }`}
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>

          <div className="flex items-center space-x-2">
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
            <button
              onClick={exportData}
              className="p-2 text-gray-400 hover:text-gray-600"
              title="Export CSV"
            >
              <FiDownload className="w-4 h-4" />
            </button>
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
          <div className="mt-4 p-4 bg-gray-50 rounded-lg animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="all">All Departments</option>
                  {depts.map((d) => (
                    <option key={d.dept_code} value={d.dept_code}>
                      {d.dept_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Year
                </label>
                <select
                  value={filters.year}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, year: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="all">All Years</option>
                  {[1, 2, 3, 4].map((y) => (
                    <option key={y} value={y}>
                      {y === 1
                        ? "1st"
                        : y === 2
                        ? "2nd"
                        : y === 3
                        ? "3rd"
                        : "4th"}{" "}
                      Year
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Section
                </label>
                <select
                  value={filters.section}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, section: e.target.value }))
                  }
                  disabled={
                    filters.department === "all" || filters.year === "all"
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  <option value="all">
                    {filters.department === "all" || filters.year === "all"
                      ? "Select Dept & Year first"
                      : "All Sections"}
                  </option>
                  {availableSections.map((s) => (
                    <option key={s} value={s}>
                      Section {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chart Content */}
      <div className="p-6">
        {loading ? (
          <div className="h-[400px] flex items-center justify-center text-gray-400">
            Loading data...
          </div>
        ) : chartData.length > 0 ? (
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={false} />
                <YAxis yAxisId="left" orientation="left" stroke="#3B82F6" />
                <YAxis yAxisId="right" orientation="right" stroke="#10B981" />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Legend />
                <Bar
                  yAxisId="left"
                  dataKey="score"
                  fill="#3B82F6"
                  name="Total Score"
                  radius={[4, 4, 0, 0]}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="totalSolved"
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Questions Solved"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-[400px] flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <p>No data found for selected filters</p>
          </div>
        )}

        {/* Data Summary Footer */}
        <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-gray-500 text-sm">Students Found</p>
            <p className="text-xl font-bold text-gray-900">
              {chartData.length}
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">Avg Score</p>
            <p className="text-xl font-bold text-blue-600">
              {Math.round(
                chartData.reduce((acc, curr) => acc + curr.score, 0) /
                  (chartData.length || 1)
              )}
            </p>
          </div>
          <div>
            <p className="text-gray-500 text-sm">Total Question Solved</p>
            <p className="text-xl font-bold text-green-600">
              {chartData.reduce((acc, curr) => acc + curr.totalSolved, 0)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveDashboard;
