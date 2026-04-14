import React, { useEffect, useMemo, useState } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../common/LoadingSpinner";
import toast from "react-hot-toast";
import { formatName, formatDepartment, formatSection } from "../utils/textFormatter";

const RankBadge = ({ rank }) => {
  if (rank === 1) {
    return <span className="text-white px-2 py-1 rounded-full">🥇</span>;
  }
  if (rank === 2) {
    return <span className="text-white px-2 py-1 rounded-full">🥈</span>;
  }
  if (rank === 3) {
    return <span className="text-white px-2 py-1 rounded-full">🥉</span>;
  }
  return <span>{rank}</span>;
};

const OverallLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchOverallLeaderboard = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/ranking/overall?limit=100");

        if (!res.ok) {
          throw new Error("Failed to fetch overall leaderboard");
        }

        const data = await res.json();

        // Defensive dedupe by student_id while preserving original rank order.
        const seen = new Set();
        const uniqueRows = (Array.isArray(data) ? data : []).filter((row) => {
          if (!row?.student_id || seen.has(row.student_id)) {
            return false;
          }
          seen.add(row.student_id);
          return true;
        });

        setLeaderboard(uniqueRows.slice(0, 100));
      } catch (err) {
        console.error("Error fetching overall leaderboard:", err);
        toast.error("Failed to load overall leaderboard");
        setLeaderboard([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOverallLeaderboard();
  }, []);

  const totalPages = Math.ceil(leaderboard.length / itemsPerPage);
  const paginatedRanks = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return leaderboard.slice(startIndex, startIndex + itemsPerPage);
  }, [leaderboard, currentPage, itemsPerPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i += 1) {
      pages.push(i);
    }
    return pages;
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div className="w-full p-6">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Overall Leaderboard</h2>
          <p className="text-gray-500 text-lg">No overall ranking data available right now.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Overall Leaderboard</h1>
        <p className="text-gray-600">Top 100 students across the platform</p>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Rank</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Student ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Department</th>
                <th className="px-6 py-3 text-center text-sm font-semibold">Year</th>
                <th className="px-6 py-3 text-center text-sm font-semibold">Section</th>
                <th className="px-6 py-3 text-center text-sm font-semibold">Solved</th>
                <th className="px-6 py-3 text-center text-sm font-semibold">Contests</th>
                <th className="px-6 py-3 text-center text-sm font-semibold">Score</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRanks.map((student, index) => {
                const rank = student.rank || (currentPage - 1) * itemsPerPage + index + 1;
                const totalSolved =
                  student.performance?.combined?.totalSolved ||
                  student.combined?.totalSolved ||
                  0;
                const totalContests =
                  student.performance?.combined?.totalContests ||
                  student.combined?.totalContests ||
                  0;

                const isCurrentUser = student.student_id === currentUser?.student_id;
                const rowClass = isCurrentUser
                  ? "bg-purple-50 border-l-4 border-purple-400"
                  : "border-b border-gray-200 hover:bg-gray-50 transition-colors";

                return (
                  <tr key={student.student_id} className={rowClass}>
                    <td className="px-6 py-4 text-center font-bold text-lg">
                      <RankBadge rank={rank} />
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-gray-700">{student.student_id}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {formatName(student.name)}
                      {isCurrentUser && (
                        <span className="ml-2 text-xs bg-purple-200 text-purple-700 px-2 py-1 rounded-full">
                          You
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-700">{formatDepartment(student.dept_name)}</td>
                    <td className="px-6 py-4 text-center text-gray-700">{student.year ?? "-"}</td>
                    <td className="px-6 py-4 text-center text-gray-700">
                      {student.section ? formatSection(student.section) : "-"}
                    </td>
                    <td className="px-6 py-4 text-center text-gray-700 font-medium">{totalSolved}</td>
                    <td className="px-6 py-4 text-center text-gray-700 font-medium">{totalContests}</td>
                    <td className="px-6 py-4 text-center font-bold text-lg text-blue-600">{student.score}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 mt-6">
          <button
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Previous page"
          >
            <FaChevronLeft size={16} />
          </button>

          {getPageNumbers().map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentPage === page
                  ? "bg-blue-600 text-white"
                  : "border border-gray-300 hover:bg-gray-50"
              }`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Next page"
          >
            <FaChevronRight size={16} />
          </button>
        </div>
      )}

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-gray-600">
          Showing {paginatedRanks.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{" "}
          {Math.min(currentPage * itemsPerPage, leaderboard.length)} of {leaderboard.length} students
        </p>
      </div>
    </div>
  );
};

export default OverallLeaderboard;
