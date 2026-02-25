import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMeta } from "../../context/MetaContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { FiBarChart2, FiDownload, FiFilter, FiRefreshCw } from "react-icons/fi";
import toast from "react-hot-toast";
import domtoimage from "dom-to-image-more";
import { jsPDF } from "jspdf";

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
  platform: "all",
};

const emptyStats = {
  options: { degrees: [] },
  overview: {
    totalStudents: 0,
    activeLeetCodeStudents: 0,
    activeGFGStudents: 0,
    activeCodeChefStudents: 0,
    activeHackerRankStudents: 0,
    activeGitHubStudents: 0,
  },
  leetcode: {
    totalContestsAttended: 0,
    totalProblemsSolved: 0,
    totalEasyProblems: 0,
    totalMediumProblems: 0,
    totalHardProblems: 0,
    averageProblemsPerStudent: 0,
  },
  gfg: {
    totalContests: 0,
    totalProblemsSolved: 0,
    totalSchool: 0,
    totalBasic: 0,
    totalEasy: 0,
    totalMedium: 0,
    totalHard: 0,
  },
  codechef: {
    totalContestsWritten: 0,
    totalProblemsSolved: 0,
  },
  hackerrank: {
    totalBadges: 0,
    badgeDistribution: [],
  },
  github: {
    totalPublicRepositories: 0,
    totalContributions: 0,
    totalActiveStudents: 0,
  },
  topDepartments: [],
};

const StatCard = ({ title, value }) => (
  <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
    <p className="text-sm text-gray-500">{title}</p>
    <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
  </div>
);

function AdminPlatformStatistics() {
  const { depts } = useMeta();
  const [loading, setLoading] = useState(true);
  const [loadingSections, setLoadingSections] = useState(false);
  const [stats, setStats] = useState(emptyStats);
  const [sectionOptions, setSectionOptions] = useState([]);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const requestIdRef = useRef(0);
  const exportPanelRef = useRef(null);

  const degreeOptions = useMemo(() => {
    const items = stats?.options?.degrees || [];
    return Array.isArray(items) ? items : [];
  }, [stats]);

  const fetchStats = useCallback(async (activeFilters, silent = false) => {
    const requestId = ++requestIdRef.current;
    if (!silent) setLoading(true);

    try {
      const params = new URLSearchParams();
      Object.entries(activeFilters).forEach(([key, value]) => {
        if (value && value !== "all") {
          params.append(key, value);
        }
      });

      const res = await fetch(`/api/admin/analytics/platform-statistics?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load platform statistics");

      const data = await res.json();
      if (requestId !== requestIdRef.current) return;
      setStats({ ...emptyStats, ...data });
    } catch (error) {
      if (requestId !== requestIdRef.current) return;
      console.error(error);
      toast.error("Failed to fetch platform statistics");
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchStats(INITIAL_FILTERS);
  }, [fetchStats]);

  useEffect(() => {
    const loadSections = async () => {
      if (filters.dept === "all" || filters.year === "all") {
        setSectionOptions([]);
        if (filters.section !== "all") {
          setFilters((prev) => {
            if (prev.section === "all") return prev;
            const next = { ...prev, section: "all" };
            fetchStats(next, true);
            return next;
          });
        }
        return;
      }

      setLoadingSections(true);
      try {
        const res = await fetch(
          `/api/meta/sections?dept=${encodeURIComponent(filters.dept)}&year=${encodeURIComponent(filters.year)}`,
          { cache: "no-store" }
        );
        if (!res.ok) throw new Error("Failed to fetch sections");

        const data = await res.json();
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

        if (filters.section !== "all") {
          const valid = mapped.some((sectionItem) => sectionItem.value === filters.section);
          if (!valid) {
            setFilters((prev) => {
              if (prev.section === "all") return prev;
              const stillValid = mapped.some((sectionItem) => sectionItem.value === prev.section);
              if (stillValid) return prev;
              const next = { ...prev, section: "all" };
              fetchStats(next, true);
              return next;
            });
          }
        }
      } catch (error) {
        console.error(error);
        setSectionOptions([]);
        toast.error("Failed to load section options");
      } finally {
        setLoadingSections(false);
      }
    };

    loadSections();
  }, [fetchStats, filters.dept, filters.year, filters.section]);

  const updateFilter = (key, value) => {
    const next = { ...filters, [key]: value };
    if (key === "dept" || key === "year") {
      next.section = "all";
    }
    setFilters(next);
    fetchStats(next, true);
  };

  const handleExportPdf = async () => {
    if (!exportPanelRef.current || isExportingPdf) return;

    setIsExportingPdf(true);
    try {
      const target = exportPanelRef.current;
      const targetWidth = Math.max(target.scrollWidth, target.clientWidth, 1);
      const targetHeight = Math.max(target.scrollHeight, target.clientHeight, 1);

      const dataUrl = await domtoimage.toPng(target, {
        bgcolor: "#f9fafb",
        cacheBust: true,
        quality: 1,
        width: targetWidth,
        height: targetHeight,
      });

      const image = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = dataUrl;
      });

      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const canvasCtx = canvas.getContext("2d");
      if (!canvasCtx) {
        throw new Error("Canvas context not available for PDF export");
      }
      canvasCtx.drawImage(image, 0, 0);

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const pxPerMm = canvas.width / pdfWidth;
      const pageHeightPx = Math.max(1, Math.floor(pdfHeight * pxPerMm));

      let renderedPages = 0;
      for (let sourceY = 0; sourceY < canvas.height; sourceY += pageHeightPx) {
        const sliceHeightPx = Math.min(pageHeightPx, canvas.height - sourceY);

        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = sliceHeightPx;

        const ctx = pageCanvas.getContext("2d");
        if (!ctx) {
          throw new Error("Canvas context not available for PDF export");
        }

        ctx.drawImage(
          canvas,
          0,
          sourceY,
          canvas.width,
          sliceHeightPx,
          0,
          0,
          canvas.width,
          sliceHeightPx
        );

        const pageData = pageCanvas.toDataURL("image/jpeg", 0.95);
        const sliceHeightMm = sliceHeightPx / pxPerMm;

        if (renderedPages > 0) {
          pdf.addPage();
        }

        pdf.addImage(pageData, "JPEG", 0, 0, pdfWidth, sliceHeightMm, undefined, "FAST");
        renderedPages += 1;
      }

      const timestamp = new Date().toISOString().split("T")[0];
      pdf.save(`platform_statistics_${timestamp}.pdf`);
      toast.success("Platform statistics exported to PDF");
    } catch (error) {
      console.error(error);
      toast.error("Failed to export platform statistics PDF");
    } finally {
      setIsExportingPdf(false);
    }
  };

  const badgeData = (stats.hackerrank.badgeDistribution || []).slice(0, 8);
  const selectedPlatform = filters.platform;

  const lcBreakdownData = [
    { label: "Easy", value: stats.leetcode.totalEasyProblems },
    { label: "Medium", value: stats.leetcode.totalMediumProblems },
    { label: "Hard", value: stats.leetcode.totalHardProblems },
  ];

  const gfgBreakdownData = [
    { label: "School", value: stats.gfg.totalSchool },
    { label: "Basic", value: stats.gfg.totalBasic },
    { label: "Easy", value: stats.gfg.totalEasy },
    { label: "Medium", value: stats.gfg.totalMedium },
    { label: "Hard", value: stats.gfg.totalHard },
  ];

  const codechefData = [
    { label: "Problems", value: stats.codechef.totalProblemsSolved },
    { label: "Contests", value: stats.codechef.totalContestsWritten },
  ];

  const hackerrankBadgeSummary = useMemo(() => {
    const preferredOrder = ["C", "C++", "Java", "Python", "SQL", "Problem Solving"];
    const lookup = new Map((stats.hackerrank.badgeDistribution || []).map((item) => [item.badge, item.students]));

    const prioritized = preferredOrder.map((name) => ({
      badge: name,
      students: lookup.get(name) || 0,
    }));

    const others = (stats.hackerrank.badgeDistribution || [])
      .filter((item) => !preferredOrder.includes(item.badge))
      .slice(0, 6);

    return [...prioritized, ...others];
  }, [stats.hackerrank.badgeDistribution]);

  const PlatformBlock = ({ title, statsGrid, chartTitle, chartData, dataKey = "value", color = "#2563eb", xAxisKey = "label" }) => (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {statsGrid}
      </div>
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-2">{chartTitle}</h4>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={xAxisKey} tick={{ fontSize: 11 }} interval={0} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey={dataKey} fill={color} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4" ref={exportPanelRef}>
      <div className="bg-white border border-gray-100 rounded-2xl p-4 md:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FiBarChart2 className="text-blue-600" /> Platform Statistics
            </h2>
            <p className="text-sm text-gray-500 mt-1">Aggregated cross-student analytics with dynamic filtering</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
                onClick={handleExportPdf}
                disabled={isExportingPdf}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
            >
                <FiDownload /> {isExportingPdf ? "Exporting PDF..." : "Export to PDF"}
            </button>
            <button
              type="button"
              onClick={() => fetchStats(filters)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              <FiRefreshCw /> Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
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
              {degreeOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Platform</label>
            <select
              value={filters.platform}
              onChange={(e) => updateFilter("platform", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Overall</option>
              <option value="leetcode">LeetCode</option>
              <option value="gfg">GeeksforGeeks</option>
              <option value="codechef">CodeChef</option>
              <option value="hackerrank">HackerRank</option>
              <option value="github">GitHub</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-10 text-center text-gray-500 border border-gray-100 shadow-sm">
          Loading platform statistics...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard title="Total Students" value={stats.overview.totalStudents} />
            <StatCard title="LeetCode Active" value={stats.overview.activeLeetCodeStudents} />
            <StatCard title="GFG Active" value={stats.overview.activeGFGStudents} />
            <StatCard title="CodeChef Active" value={stats.overview.activeCodeChefStudents} />
            <StatCard title="HackerRank Active" value={stats.overview.activeHackerRankStudents} />
            <StatCard title="GitHub Active" value={stats.overview.activeGitHubStudents} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {(selectedPlatform === "all" || selectedPlatform === "leetcode") && (
              <PlatformBlock
                title="LeetCode"
                statsGrid={[
                  <StatCard key="lc-total" title="Total Problems Solved" value={stats.leetcode.totalProblemsSolved} />,
                  <StatCard key="lc-contests" title="Total Contests" value={stats.leetcode.totalContestsAttended} />,
                  <StatCard
                    key="lc-break"
                    title="Easy / Medium / Hard"
                    value={`${stats.leetcode.totalEasyProblems} / ${stats.leetcode.totalMediumProblems} / ${stats.leetcode.totalHardProblems}`}
                  />,
                  <StatCard key="lc-avg" title="Average Problems / Student" value={stats.leetcode.averageProblemsPerStudent} />,
                ]}
                chartTitle="Difficulty Breakdown"
                chartData={lcBreakdownData}
                color="#f59e0b"
              />
            )}

            {(selectedPlatform === "all" || selectedPlatform === "gfg") && (
              <PlatformBlock
                title="GeeksforGeeks"
                statsGrid={[
                  <StatCard key="gfg-total" title="Total Problems Solved" value={stats.gfg.totalProblemsSolved} />,
                  <StatCard key="gfg-contests" title="Total Contests" value={stats.gfg.totalContests} />,
                  <StatCard
                    key="gfg-break"
                    title="Easy / Medium / Hard"
                    value={`${stats.gfg.totalEasy} / ${stats.gfg.totalMedium} / ${stats.gfg.totalHard}`}
                  />,
                  <StatCard key="gfg-bs" title="Basic / School" value={`${stats.gfg.totalBasic} / ${stats.gfg.totalSchool}`} />,
                ]}
                chartTitle="Category Breakdown"
                chartData={gfgBreakdownData}
                color="#16a34a"
              />
            )}

            {(selectedPlatform === "all" || selectedPlatform === "codechef") && (
              <PlatformBlock
                title="CodeChef"
                statsGrid={[
                  <StatCard key="cc-problems" title="Total Problems Solved" value={stats.codechef.totalProblemsSolved} />,
                  <StatCard key="cc-contests" title="Total Contests Written" value={stats.codechef.totalContestsWritten} />,
                ]}
                chartTitle="Problems vs Contests"
                chartData={codechefData}
                color="#2563eb"
              />
            )}

            {(selectedPlatform === "all" || selectedPlatform === "hackerrank") && (
              <PlatformBlock
                title="HackerRank"
                statsGrid={[
                  <StatCard key="hr-total" title="Total Badges" value={stats.hackerrank.totalBadges} />,
                  <StatCard key="hr-badges" title="Badge Categories" value={stats.hackerrank.badgeDistribution.length} />,
                ]}
                chartTitle="Badge-wise Student Distribution"
                chartData={hackerrankBadgeSummary}
                dataKey="students"
                xAxisKey="badge"
                color="#7c3aed"
              />
            )}

            {(selectedPlatform === "all" || selectedPlatform === "github") && (
              <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-3 lg:col-span-2">
                <h3 className="text-lg font-semibold text-gray-900">GitHub</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <StatCard title="Total Public Repositories" value={stats.github.totalPublicRepositories} />
                  <StatCard title="Total Contributions" value={stats.github.totalContributions} />
                  <StatCard title="Active GitHub Students" value={stats.github.totalActiveStudents} />
                </div>
              </div>
            )}

            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm space-y-3 lg:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900">Top Departments (Filtered)</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.topDepartments || []} margin={{ top: 8, right: 8, left: -20, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="dept_name" tick={{ fontSize: 11 }} interval={0} />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="student_count" fill="#0ea5e9" isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {badgeData.length === 0 && (
              <div className="text-sm text-gray-500 lg:col-span-2">No badge distribution available for current filters.</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default AdminPlatformStatistics;
