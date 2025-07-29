import React, { useEffect, useState, lazy, Suspense } from "react";
import { TbUserShare } from "react-icons/tb";
const ViewProfile = lazy(() => import("./ViewProfile"));
import { FaSearch } from "react-icons/fa";
import { useMeta } from "../context/MetaContext";
import LoadingSpinner from "../common/LoadingSpinner";
import { FaDownload } from "react-icons/fa6";
import { IoIosSync } from "react-icons/io";
import * as XLSX from "xlsx";
import dayjs from "dayjs";
import Pagination from "./ui/Pagination";

const RankBadge = ({ rank }) => {
  if (rank === 1)
    return <span className=" text-white px-2 py-1 rounded-full">🥇</span>;
  if (rank === 2)
    return <span className=" text-white px-2 py-1 rounded-full">🥈</span>;
  if (rank === 3)
    return <span className=" text-white px-2 py-1 rounded-full">🥉</span>;
  return <span>{rank}th</span>;
};

const TOP_X_OPTIONS = [
  { label: "All Students", value: "" },
  { label: "Top 5", value: 5 },
  { label: "Top 10", value: 10 },
  { label: "Top 25", value: 25 },
  { label: "Top 50", value: 50 },
  { label: "Top 100", value: 100 },
];

const RankingTable = ({ filter }) => {
  const [ranks, setRanks] = useState([]);
  const [allRanks, setAllRanks] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    totalStudents: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    dept: "",
    year: "",
    section: "",
  });
  const [topX, setTopX] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const { depts, years, sections } = useMeta();

  const fetchRanks = async (forDownload = false) => {
    try {
      setLoading(true);
      let params = { ...filters };

      if (!forDownload) {
        if (topX) {
          params.limit = topX;
        } else {
          params.page = pagination.page;
          params.limit = pagination.limit;
        }
      } else if (forDownload && topX) {
        params.limit = topX;
      }

      if (search) params.search = search;

      // Build query string
      const queryString = Object.entries(params)
        .filter(([_, v]) => v !== "" && v !== undefined)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
        .join("&");

      let url;
      if (!filters.dept && !filters.year && !filters.section && !search) {
        url = `/api/ranking/overall${queryString ? "?" + queryString : ""}`;
      } else {
        url = `/api/ranking/filter${queryString ? "?" + queryString : ""}`;
      }

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch rankings");
      const data = await res.json();

      if (forDownload) {
        setAllRanks(data.students || []);
      } else {
        setRanks(data.students || []);
        setPagination(
          data.pagination || {
            page: 1,
            limit: 100,
            totalStudents: 0,
            totalPages: 0,
          }
        );
      }
    } catch (err) {
      console.error(err);
      if (!forDownload) setRanks([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchRanks();
    }, search ? 300 : 0);
    return () => clearTimeout(timeoutId);
  }, [JSON.stringify(filters), topX ? 1 : pagination.page, search, topX]);

  const handleChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    // Reset to page 1 when changing filters
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const filteredRanks = ranks;

  // Function to trigger manual ranking update
  const updateRankings = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/ranking/update-all", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to trigger ranking update");
      }

      // Show success message
      alert(
        "Ranking update started in the background. This may take a few minutes."
      );

      // Refresh the current page after a short delay
      setTimeout(() => {
        fetchRanks();
      }, 2000);
    } catch (error) {
      console.error("Error updating rankings:", error);
      alert("Failed to update rankings. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const downloadSampleXLSX = async () => {
    await fetchRanks(true);

    const largeData = [];
    largeData.push([
      "Student Id",
      "Student Name",
      "Branch",
      "year",
      "Section",
      "Lt_easy",
      "Lt_med",
      "Lt_hard",
      "Lt_Contest",
      "Lt_badges",
      "GFG_school",
      "GFG_basic",
      "GFG_easy",
      "GFG_med",
      "GFG_hard",
      "GFG_Contests",
      "CC_problems",
      "CC_Contests",
      "CC_stars",
      "CC_badges",
      "HR_badges",
      "Score",
    ]);

    allRanks.forEach((rank) => {
      largeData.push([
        rank.student_id,
        rank.name,
        rank.dept_name,
        rank.year,
        rank.section,
        rank?.performance?.platformWise?.leetcode?.easy,
        rank?.performance?.platformWise?.leetcode?.medium,
        rank?.performance?.platformWise?.leetcode?.hard,
        rank?.performance?.platformWise?.leetcode?.contests,
        rank?.performance?.platformWise?.leetcode?.badges,
        rank?.performance?.platformWise?.gfg?.school,
        rank?.performance?.platformWise?.gfg?.basic,
        rank?.performance?.platformWise?.gfg?.easy,
        rank?.performance?.platformWise?.gfg?.medium,
        rank?.performance?.platformWise?.gfg?.hard,
        rank?.performance?.platformWise?.gfg?.contests,
        rank?.performance?.platformWise?.codechef?.problems,
        rank?.performance?.platformWise?.codechef?.contests,
        rank?.performance?.platformWise?.codechef?.stars,
        rank?.performance?.platformWise?.codechef?.badges,
        rank?.performance?.platformWise?.hackerrank?.badges,
        rank.score,
      ]);
    });

    const now = new Date();
    const formattedDate = dayjs(now).format("DD/MM/YYYY | hh:mm A");
    const deptName =
      depts.find((d) => d.dept_code === filters.dept)?.dept_name ||
      filters.dept;
    const filenamePrefix =
      `${deptName || ""}${filters?.year ? " " + filters.year + "_year" : ""}${
        filters?.section ? " " + filters.section + "_sec" : ""
        } ${filter.topX ? "" + filter.topX + "_top" : ""}`.trim() || "overall";
    // 2. Convert array of arrays to worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(largeData);

    // 3. Create a new workbook and append the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Faculty");

    // 4. Write workbook to binary array buffer
    const arrayBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    // 5. Convert to Blob and trigger download
    const blob = new Blob([arrayBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filenamePrefix} ${formattedDate}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Suspense fallback={<LoadingSpinner />}>
        {selectedStudent && (
          <ViewProfile
            student={selectedStudent}
            onClose={() => setSelectedStudent(null)}
          />
        )}
      </Suspense>
      <div className="lg:p-6">
        <div className="flex flex-row justify-between ">
          <h1 className="md:text-2xl text-xl font-semibold mb-4 px-6">
            🏆 Student Rankings
          </h1>
        </div>
        {/* Filters */}
        {filter && (
          <>
            <div className="flex flex-wrap justify-between gap-2 mb-6">
              <div className="grid grid-cols-3 md:grid-cols-4 items-center gap-4 text-sm ">
                <div>
                  <label
                    className="block text-xs font-semibold text-gray-500 mb-1"
                    htmlFor="department"
                  >
                    Branch
                  </label>
                  <select
                    id="department"
                    onChange={(e) => handleChange("dept", e.target.value)}
                    className="border border-gray-300  hover:bg-blue-50 p-2 rounded-lg transition outline-none"
                    value={filters.dept}
                  >
                    <option value="">All Branches</option>
                    {depts.map((dept) => (
                      <option key={dept.dept_code} value={dept.dept_code}>
                        {dept.dept_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    className="block text-xs font-semibold text-gray-500 mb-1"
                    htmlFor="year"
                  >
                    Year
                  </label>
                  <select
                    id="year"
                    onChange={(e) => handleChange("year", e.target.value)}
                    className="border border-gray-300 hover:bg-blue-50 p-2 rounded-lg transition outline-none"
                    value={filters.year}
                  >
                    <option value="">All Years</option>
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    className="block text-xs font-semibold text-gray-500 mb-1"
                    htmlFor="section"
                  >
                    Section
                  </label>
                  <select
                    id="section"
                    onChange={(e) => handleChange("section", e.target.value)}
                    className="border border-gray-300 hover:bg-blue-50 p-2 rounded-lg transition outline-none"
                    value={filters.section}
                  >
                    <option value="">All Sections</option>
                    {sections.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    className="block text-xs font-semibold text-gray-500 mb-1"
                    htmlFor="topx"
                  >
                    Show
                  </label>
                  <select
                    id="topx"
                    value={topX}
                    onChange={(e) => {
                      setTopX(e.target.value);
                      setPagination((prev) => ({ ...prev, page: 1 }));
                    }}
                    className="border border-gray-300 hover:bg-blue-50 p-2 rounded-lg transition outline-none"
                  >
                    {TOP_X_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className=" flex flex-col md:flex-row gap-3  py-3">
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 opacity-85 text-blue-800" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={search}
                    onChange={handleSearch}
                    className="pl-10 pr-3 py-2 border border-gray-300 rounded-lg hover:bg-blue-50  focus:ring-1 focus:ring-blue-600  md:w-[240px] w-full transition outline-none "
                  />
                </div>
                <div className="flex gap-2">
                <button
                    className="p-2  items-center rounded-lg bg-blue-600 flex gap-2 text-white"
                  onClick={downloadSampleXLSX}
                  disabled={loading}
                  >
                  <FaDownload /> Download
                </button>
                <button
                    className="p-2 w-3/4 items-center rounded-lg bg-green-600 flex gap-2 text-white"
                  onClick={updateRankings}
                  disabled={loading}
                  >
                  <IoIosSync className={loading ? "animate-spin" : ""} /> Update
                  Rankings
                </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Table */}
        <table className="min-w-full bg-white border rounded-lg overflow-hidden shadow text-xs md:text-base">
          <thead className="bg-gray-100 text-center">
            <tr>
              <th className="py-3 lg:px-4 px-1">Rank</th>
              <th className="py-3 lg:px-4 px-1 text-left">Student</th>
              <th className="py-3 lg:px-4 px-1">Roll Number</th>
              <th className="py-3 lg:px-4 px-1 sr-only md:not-sr-only">
                Branch
              </th>
              <th className="py-3 lg:px-4 px-1  sr-only md:not-sr-only">
                Year
              </th>
              <th className="py-3 lg:px-4 px-1  sr-only md:not-sr-only">
                Section
              </th>
              <th className="py-3 lg:px-4 px-1">Score</th>
              <th className="py-3 lg:px-4 px-1">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRanks.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-10 text-gray-500">
                  No students in ranking
                </td>
              </tr>
            ) : (
              filteredRanks.map((s) => (
                <tr key={s.student_id} className="hover:bg-gray-50 text-center" data-aos="fade-left">
                  <td className="py-3 px-1 md:px-4 ">
                    <RankBadge rank={s.rank} />
                  </td>
                  <td className="py-3 md:px-4  px-1 text-left flex items-center gap-2">
                    <div className=" hidden bg-blue-100 text-blue-800 rounded-full w-8 h-8 md:flex items-center text-sm justify-center font-bold">
                      {s.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    {s.name}
                  </td>
                  <td className="py-3 px-4">{s.student_id}</td>
                  <td className="py-3 md:px-4 px-1 sr-only md:not-sr-only">
                    {s.dept_name}
                  </td>
                  <td className="py-3 md:px-4 px-1 sr-only md:not-sr-only">
                    {s.year}
                  </td>
                  <td className="py-3 md:px-4 px-1 sr-only md:not-sr-only">
                    {s.section}
                  </td>
                  <td className="py-3 md:px-4 px-1 font-semibold">{s.score}</td>
                  <td className="py-3 md:px-4 px-1 ">
                    <div
                      onClick={() => setSelectedStudent(s)}
                      className="text-gray-700 px-1 py-1 justify-center rounded hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                    >
                      <TbUserShare /><span className="hidden md:block">Profile</span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {!topX && (
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalStudents}
            itemsPerPage={ranks.length}
            onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
            loading={loading}
          />
        )}
        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-center my-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
          </div>
        )}

      </div>
    </>
  );
};

export default RankingTable;
