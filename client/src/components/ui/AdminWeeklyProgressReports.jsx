import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FiActivity,
  FiDownload,
  FiFilter,
  FiRefreshCw,
  FiTrendingDown,
  FiTrendingUp,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { useMeta } from "../../context/MetaContext";
import { exportWeeklyProgressToExcel } from "../../utils/excelExport";

const YEAR_OPTIONS = [
  { value: "1", label: "First Year" },
  { value: "2", label: "Second Year" },
  { value: "3", label: "Third Year" },
  { value: "4", label: "Fourth Year" },
];

const INITIAL_FILTERS = {
  dept: "all",
  year: "all",
  section: "all",
  degree: "all",
};

const emptyWeeklyData = {
  filters: INITIAL_FILTERS,
  options: {
    degrees: [],
  },
  weekRange: {
    thisWeekStart: "-",
    thisWeekEnd: "-",
    lastWeekStart: "-",
    lastWeekEnd: "-",
  },
  summary: {
    totalStudentsInScope: 0,
    totalStudentsActiveThisWeek: 0,
    totalProblemsAddedThisWeek: 0,
    totalContestsAddedThisWeek: 0,
    studentsImproved: 0,
    studentsDeclined: 0,
    studentsUnchanged: 0,
  },
  platformComparison: [],
  platformContestComparison: [],
  topPerformers: [],
  studentActivity: [],
};

const StatCard = ({ title, value, icon }) => (
  <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
    <p className="text-sm text-gray-500 flex items-center gap-2">
      {icon} {title}
    </p>
    <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
  </div>
);

const formatGrowth = (value) => {
  if (value > 0) return `+${value}`;
  return String(value || 0);
};

function AdminWeeklyProgressReports() {
  const { depts } = useMeta();
  const [loading, setLoading] = useState(true);
  const [loadingSections, setLoadingSections] = useState(false);
  const [sectionOptions, setSectionOptions] = useState([]);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [weeklyData, setWeeklyData] = useState(emptyWeeklyData);
  const requestIdRef = useRef(0);

  const fetchWeeklyData = useCallback(async (activeFilters, refresh = false, silent = false) => {
    const requestId = ++requestIdRef.current;
    if (!silent) setLoading(true);

    try {
      const params = new URLSearchParams();
      Object.entries(activeFilters).forEach(([key, value]) => {
        if (value && value !== "all") {
          params.append(key, value);
        }
      });
      if (refresh) {
        params.append("refresh", "true");
      }

      const query = params.toString();
      const response = await fetch(`/api/admin/analytics/weekly-progress${query ? `?${query}` : ""}`, {
        cache: "no-store",
      });

      if (!response.ok) throw new Error("Failed to load weekly progress");

      const payload = await response.json();
      if (requestId !== requestIdRef.current) return;

      setWeeklyData({ ...emptyWeeklyData, ...payload });
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      console.error(error);
      toast.error("Failed to fetch weekly progress");
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchWeeklyData(INITIAL_FILTERS);
  }, [fetchWeeklyData]);

  useEffect(() => {
    const loadSections = async () => {
      if (filters.dept === "all" || filters.year === "all") {
        setSectionOptions([]);
        if (filters.section !== "all") {
          setFilters((prev) => {
            if (prev.section === "all") return prev;
            const next = { ...prev, section: "all" };
            fetchWeeklyData(next, false, true);
            return next;
          });
        }
        return;
      }

      setLoadingSections(true);
      try {
        const response = await fetch(
          `/api/meta/sections?dept=${encodeURIComponent(filters.dept)}&year=${encodeURIComponent(filters.year)}`,
          { cache: "no-store" }
        );
        if (!response.ok) throw new Error("Failed to load sections");

        const data = await response.json();
        const list = Array.isArray(data) ? data : [];

        const mapped = list.map((rawSection) => {
          const value = String(rawSection).trim();
          const numeric = Number(value);

          if (Number.isInteger(numeric) && numeric >= 1 && numeric <= 26) {
            const letter = String.fromCharCode(64 + numeric);
            return { value: letter, label: `Section ${letter}` };
          }

          const upper = value.toUpperCase();
          if (/^[A-Z]$/.test(upper)) {
            return { value: upper, label: `Section ${upper}` };
          }

          return { value, label: `Section ${value}` };
        });

        setSectionOptions(mapped);
      } catch (error) {
        console.error(error);
        setSectionOptions([]);
        toast.error("Failed to load section options");
      } finally {
        setLoadingSections(false);
      }
    };

    loadSections();
  }, [fetchWeeklyData, filters.dept, filters.year, filters.section]);

  const updateFilter = (key, value) => {
    const next = { ...filters, [key]: value };
    if (key === "dept" || key === "year") {
      next.section = "all";
    }

    setFilters(next);
    fetchWeeklyData(next, false, true);
  };

  const handleRefresh = () => {
    fetchWeeklyData(filters, true);
    toast.success("Weekly report refreshed");
  };

  const handleDownload = () => {
    try {
      exportWeeklyProgressToExcel(weeklyData);
      toast.success("Weekly report exported to Excel");
    } catch (error) {
      console.error(error);
      toast.error("Failed to export weekly report");
    }
  };

  const degreeOptions = useMemo(() => {
    const items = weeklyData?.options?.degrees || [];
    return Array.isArray(items) ? items : [];
  }, [weeklyData]);

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-100 rounded-2xl p-4 md:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FiActivity className="text-blue-600" /> Weekly Progress Reports
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Week-over-week growth (Monday to Sunday) with filter-based comparison
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              <FiDownload /> Download Weekly Report (Excel)
            </button>
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              <FiRefreshCw /> Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-gray-500 flex items-center gap-1 mb-1">
              <FiFilter /> Department
            </label>
            <select
              value={filters.dept}
              onChange={(e) => updateFilter("dept", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Overall</option>
              {depts.map((d) => (
                <option key={d.dept_code} value={d.dept_code}>
                  {d.dept_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Year</label>
            <select
              value={filters.year}
              onChange={(e) => updateFilter("year", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Overall</option>
              {YEAR_OPTIONS.map((yearOption) => (
                <option key={yearOption.value} value={yearOption.value}>
                  {yearOption.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Section</label>
            <select
              value={filters.section}
              onChange={(e) => updateFilter("section", e.target.value)}
              disabled={filters.dept === "all" || filters.year === "all" || loadingSections}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Overall</option>
              {sectionOptions.map((sectionItem) => (
                <option key={sectionItem.value} value={sectionItem.value}>
                  {sectionItem.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Degree</label>
            <select
              value={filters.degree}
              onChange={(e) => updateFilter("degree", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Overall</option>
              {degreeOptions.map((degree) => (
                <option key={degree} value={degree}>
                  {degree}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 text-sm">
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-blue-900">
            This Week: <span className="font-semibold">{weeklyData.weekRange.thisWeekStart} to {weeklyData.weekRange.thisWeekEnd}</span>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-700">
            Last Week: <span className="font-semibold">{weeklyData.weekRange.lastWeekStart} to {weeklyData.weekRange.lastWeekEnd}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-10 text-center text-gray-500 border border-gray-100 shadow-sm">
          Loading weekly progress...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard
              title="Students Active"
              value={weeklyData.summary.totalStudentsActiveThisWeek}
              icon={<FiActivity />}
            />
            <StatCard
              title="Problems Added"
              value={weeklyData.summary.totalProblemsAddedThisWeek}
              icon={<FiTrendingUp />}
            />
            <StatCard
              title="Contests Added"
              value={weeklyData.summary.totalContestsAddedThisWeek}
              icon={<FiTrendingUp />}
            />
            <StatCard title="Students Improved" value={weeklyData.summary.studentsImproved} icon={<FiTrendingUp />} />
            <StatCard title="Students Declined" value={weeklyData.summary.studentsDeclined} icon={<FiTrendingDown />} />
            <StatCard title="Students In Scope" value={weeklyData.summary.totalStudentsInScope} icon={<FiFilter />} />
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Platform Growth Comparison</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-200">
                    <th className="py-2 pr-3">Platform</th>
                    <th className="py-2 pr-3">Last Week</th>
                    <th className="py-2 pr-3">This Week</th>
                    <th className="py-2 pr-3">Growth</th>
                  </tr>
                </thead>
                <tbody>
                  {weeklyData.platformComparison.map((row) => {
                    const growth = Number(row.growth || 0);
                    const growthClass =
                      growth > 0 ? "text-green-600" : growth < 0 ? "text-red-600" : "text-gray-700";

                    return (
                      <tr key={row.platform} className="border-b border-gray-100 last:border-0">
                        <td className="py-2 pr-3 font-medium text-gray-900">{row.platform}</td>
                        <td className="py-2 pr-3 text-gray-700">{row.lastWeek}</td>
                        <td className="py-2 pr-3 text-gray-700">{row.thisWeek}</td>
                        <td className={`py-2 pr-3 font-semibold ${growthClass}`}>{formatGrowth(growth)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Contest Participation Growth</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-200">
                    <th className="py-2 pr-3">Platform</th>
                    <th className="py-2 pr-3">Last Week</th>
                    <th className="py-2 pr-3">This Week</th>
                    <th className="py-2 pr-3">Growth</th>
                  </tr>
                </thead>
                <tbody>
                  {weeklyData.platformContestComparison.map((row) => {
                    const growth = Number(row.growth || 0);
                    const growthClass =
                      growth > 0 ? "text-green-600" : growth < 0 ? "text-red-600" : "text-gray-700";

                    return (
                      <tr key={`contest-${row.platform}`} className="border-b border-gray-100 last:border-0">
                        <td className="py-2 pr-3 font-medium text-gray-900">{row.platform}</td>
                        <td className="py-2 pr-3 text-gray-700">{row.lastWeek}</td>
                        <td className="py-2 pr-3 text-gray-700">{row.thisWeek}</td>
                        <td className={`py-2 pr-3 font-semibold ${growthClass}`}>{formatGrowth(growth)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Top 10 Weekly Performers</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-200">
                    <th className="py-2 pr-3">Rank</th>
                    <th className="py-2 pr-3">Student ID</th>
                    <th className="py-2 pr-3">Dept</th>
                    <th className="py-2 pr-3">Year</th>
                    <th className="py-2 pr-3">Section</th>
                    <th className="py-2 pr-3">Problems Δ</th>
                    <th className="py-2 pr-3">Contests Δ</th>
                    <th className="py-2 pr-3">Badges Δ</th>
                    <th className="py-2 pr-3">Activity Score</th>
                  </tr>
                </thead>
                <tbody>
                  {weeklyData.topPerformers.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-3 text-gray-500">
                        No active weekly improvements found for current filters.
                      </td>
                    </tr>
                  ) : (
                    weeklyData.topPerformers.map((row, index) => (
                      <tr key={`${row.studentId}-${index}`} className="border-b border-gray-100 last:border-0">
                        <td className="py-2 pr-3 font-semibold text-gray-900">{index + 1}</td>
                        <td className="py-2 pr-3 text-gray-800">{row.studentId}</td>
                        <td className="py-2 pr-3 text-gray-700">{row.deptCode || "-"}</td>
                        <td className="py-2 pr-3 text-gray-700">{row.year || "-"}</td>
                        <td className="py-2 pr-3 text-gray-700">{row.section || "-"}</td>
                        <td className="py-2 pr-3 text-green-700 font-medium">{formatGrowth(row.problemsDelta)}</td>
                        <td className="py-2 pr-3 text-blue-700 font-medium">{formatGrowth(row.contestsDelta)}</td>
                        <td className="py-2 pr-3 text-purple-700 font-medium">{formatGrowth(row.hackerrankDelta)}</td>
                        <td className="py-2 pr-3 text-gray-900 font-semibold">{row.activityIncrease}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default AdminWeeklyProgressReports;
