import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PlatformCard from "../components/ui/PlatformCard";
import StatsCard from "../components/ui/StatsCard";
import { FiCode } from "react-icons/fi";

export default function CheckYourScore() {
  const [form, setForm] = useState({
    name: "",
    rollno: "",
    leetcode: "",
    gfg: "",
    codechef: "",
    hankerrank: "",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [grade, setGrades] = useState([]);
  const getPoints = (metric) =>
    grade.find((g) => g.metric === metric)?.points || 0;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };
  const fetchGrades = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/meta/grading");
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to fetch grades");
      setGrades(data.grading || data); // adjust if your backend returns {grades: [...]}
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrades();
  }, []);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    if (
      form.codechef == "" &&
      form.gfg == "" &&
      form.hankerrank == "" &&
      form.leetcode == ""
    ) {
      setError("Atleast one platform id is required!");
      setLoading(false);
      setResult(null);
      return;
    }
    // Prepare payload for backend scraping endpoint
    const payload = {
      profiles: [
        {
          leetcode_id: form.leetcode,
          codechef_id: form.codechef,
          geeksforgeeks_id: form.gfg,
          hackerrank_id: form.hankerrank,
          leetcode_status: form.leetcode ? "accepted" : "none",
          codechef_status: form.codechef ? "accepted" : "none",
          geeksforgeeks_status: form.gfg ? "accepted" : "none",
          hackerrank_status: form.hankerrank ? "accepted" : "none",
        },
      ],
    };

    try {
      // Call your backend endpoint that triggers scraping
      const response = await fetch("/api/check-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to fetch coding profiles");

      // Optionally, you can display the result or just print to console
      setResult(data);
    } catch (err) {
      setError(err.message);
      setResult(null);
      return;
    } finally {
      setLoading(false);
      
    }
  };

  const fields = [
    { label: "Name", key: "name" },
    { label: "Roll No", key: "rollno" },
    { label: "LeetCode", key: "leetcode" },
    { label: "GeeksforGeeks", key: "gfg" },
    { label: "CodeChef", key: "codechef" },
    { label: "HackerRank", key: "hankerrank" },
  ];

  return (
    <>
      <Navbar />
      <div className="bg-white max-w-5xl mx-auto shadow-md p-10 mb-10 rounded-xl">
        <h1 className="text-center text-4xl font-bold text-blue-600 mb-8">
          Check Your Score
        </h1>
        <form onSubmit={handleSubmit} className="w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {fields.map(({ label, key }) => (
              <div className="flex flex-col gap-2" key={key}>
                <label htmlFor={key}>{label}:</label>
                <input
                  type="text"
                  name={key}
                  id={key}
                  value={form[key]}
                  onChange={handleChange}
                  placeholder={`Enter your ${label}${
                    label === "Name" || label === "Roll No" ? "" : " ID"
                  }`}
                  className="p-3 rounded-md border border-gray-300 focus:ring-1 focus:outline-0 focus:ring-blue-600 w-full"
                />
              </div>
            ))}
          </div>
          <div className="mt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white border border-blue-600 text-blue-600 font-medium py-3 rounded-md hover:bg-blue-600 hover:text-white transition duration-300"
            >
              {loading ? "Checking..." : "Check Score"}
            </button>
          </div>
        </form>
        {error && <div className="text-red-600 mt-4">{error}</div>}
        {result && (
          <div>
            <div className="bg-blue-50 grid grid-cols-1 md:grid-cols-3 rounded-lg gap-5 p-5 mt-10">
              <StatsCard
                icon={<FiCode />}
                color="success"
                title="Score"
                value={
                  (result.data.leetcode?.Problems.Easy || 0) *
                  getPoints("easy_lc") +
                  (result.data.geeksforgeeks?.School || 0) *
                  getPoints("school_gfg") +
                  (result.data.geeksforgeeks?.Basic || 0) *
                  getPoints("basic_gfg") +
                  (result.data.geeksforgeeks?.Easy || 0) *
                  getPoints("easy_gfg") +
                  ((result.data.codechef?.problemsSolved || 0) *
                    getPoints("problems_cc") +
                    (result.data.leetcode?.Problems.Medium || 0) *
                    getPoints("medium_lc") +
                    (result.data.geeksforgeeks?.Medium || 0) *
                    getPoints("medium_gfg")) +
                  (result.data.leetcode?.Problems.Hard || 0) *
                  getPoints("hard_lc") +
                  (result.data.geeksforgeeks?.Hard || 0) *
                  getPoints("hard_gfg") +
                  (result.data.leetcode?.Badges || 0) * getPoints("badges_lc") +
                  (result.data.codechef?.Badges || 0) * getPoints("badges_cc") +
                  (result.data.leetcode?.Contests_Attended || 0) *
                  getPoints("contests_lc") +
                  (result.data.codechef?.Contests_Participated || 0) *
                  getPoints("contests_cc") +
                  (result.data.hackerrank?.Total_stars || 0) *
                  getPoints("stars_hr") +
                  (result.data.codechef?.Star || 0) * getPoints("stars_cc")
                }
              />
              <StatsCard
                icon={<FiCode />}
                color="blue"
                title="Total Problems Solved"
                value={
                  (result.data.leetcode?.Problems.Easy || 0) +
                  (result.data.leetcode?.Problems.Medium || 0) +
                  (result.data.leetcode?.Problems.Hard || 0) +
                  (result.data.codechef?.problemsSolved || 0) +
                  (result.data?.geeksforgeeks?.School || 0) +
                  (result.data?.geeksforgeeks?.Basic || 0) +
                  (result.data?.geeksforgeeks?.Easy || 0) +
                  (result.data?.geeksforgeeks?.Medium || 0) +
                  (result.data?.geeksforgeeks?.Hard || 0)
                }
              />
              <StatsCard
                icon={<FiCode />}
                color="purple"
                title="Total Contests Attended"
                value={
                  result.data.leetcode?.Contests_Attended ||
                  0 + result.data.codechef?.Contests_Participated ||
                  0
                }
              />

            </div>
            <div className="mt-8 p-4 bg-blue-50 rounded grid grid-cols-1 md:grid-cols-2 gap-4">
              {result.data?.leetcode && (
                <PlatformCard
                  name="LeetCode"
                  color="hover:text-yellow-600 hover:shadow-yellow-600"
                  icon="/LeetCode_logo.png"
                  total={
                    (result.data.leetcode?.Problems.Easy || 0) +
                    (result.data.leetcode?.Problems.Medium || 0) +
                    (result.data.leetcode?.Problems.Hard || 0)
                  }
                  breakdown={{
                    Easy: result.data.leetcode?.Problems.Easy,
                    Medium: result.data.leetcode?.Problems.Medium,
                    Hard: result.data.leetcode?.Problems.Hard,
                    Contests: result.data.leetcode?.Contests_Attended,
                    Badges: result.data.leetcode?.Badges,
                  }}
                />
              )}
              {result.data?.hackerrank && (
                <PlatformCard
                  name="HackerRank"
                  color="hover:text-green-600 hover:shadow-green-600"
                  icon="/HackerRank_logo.png"
                  total={result.data.hackerrank?.Total_stars || 0}
                  breakdown={{
                    "Badges": (result.data.hackerrank.Badges || [])
                      .map(b => `${b.name}: ${b.stars}★`)
                      .join(", "),
                  }} subtitle="Badges Gained"
                />
              )}
              {result.data?.codechef && (
                <PlatformCard
                  name="CodeChef"
                  color=" hover:text-orange-900 hover:shadow-orange-900"
                  icon="/codechef_logo.png"
                  total={result.data.codechef?.Contests_Participated || 0}
                  subtitle="Contests Participated"
                  breakdown={{
                    "Problems Solved": result.data.codechef?.problemsSolved,
                    Star: result.data.codechef?.Star,
                    Badges: result.data.codechef?.Badges,
                  }}
                />
              )}
              {result.data?.geeksforgeeks && (
                <PlatformCard
                  name="GeeksforGeeks"
                  color="hover:text-green-800 hover:shadow-green-800"
                  icon="/GeeksForGeeks_logo.png"
                  total={
                    (Number(result.data.geeksforgeeks?.School) || 0) +
                    (Number(result.data.geeksforgeeks?.Basic) || 0) +
                    (Number(result.data.geeksforgeeks?.Easy) || 0) +
                    (Number(result.data.geeksforgeeks?.Medium) || 0) +
                    (Number(result.data.geeksforgeeks?.Hard) || 0)
                  }
                  breakdown={{
                    School: result.data.geeksforgeeks?.School ?? 0,
                    Basic: result.data.geeksforgeeks?.Basic ?? 0,
                    Easy: result.data.geeksforgeeks?.Easy ?? 0,
                    Medium: result.data.geeksforgeeks?.Medium ?? 0,
                    Hard: result.data.geeksforgeeks?.Hard ?? 0,
                  }}
                />
              )}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}
