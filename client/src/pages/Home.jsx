import React, { useEffect, useState } from "react";
import Login from "./Login";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import { FiMenu, FiX } from "react-icons/fi";
import Navbar from "../components/Navbar";

const RankBadge = ({ rank }) => {
  if (rank === 1)
    return <span className=" text-white px-2 py-1 rounded-full">🥇</span>;
  if (rank === 2)
    return <span className=" text-white px-2 py-1 rounded-full">🥈</span>;
  if (rank === 3)
    return <span className=" text-white px-2 py-1 rounded-full">🥉</span>;
  return <span>{rank}th</span>;
};

function Home() {
  const [ranks, setRanks] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const fetchRanks = async () => {
    try {
      setLoading(true);
      const limit = 10;
      const url = `/api/ranking/overall?limit=${limit}&page=1`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch ranks");
      }

      const data = await response.json();
      // API returns array directly
      setRanks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching ranks:", err);
      setRanks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRanks();
  }, []);
  return (
    <div className="overflow-hidden">
      <img src="/home_bg.svg" alt="" className="absolute -z-10 top-0 w-full" />
      <Navbar />
      <div className="relative flex flex-col lg:flex-row px-5 lgS:px-10 xl:px-40 justify-between items-center">
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left "
          data-aos="fade-right">
          <div className="flex flex-col">
            <h1 className="text-2xl lg:text-3xl xl:text-6xl font-bold tracking-wide mb-4">
              Track Your Coding <br /> Journey with Precision
            </h1>
            <p className="text-gray-600 max-w-xl mb-6">
              CodeTrack helps you monitor your progress, set goals, and compete
              with peers to become a better programmer every day.
            </p>
          </div>
          <div className="flex justify-center gap-4">
            <Link to="/checkscore"><button className="bg-blue-600 py-2 px-4 rounded-lg text-base hover:bg-transparent border border-blue-600 text-white hover:text-blue-600">
              Check Your Score
            </button></Link>
          </div>
        </div>
        <div className="my-8"
          data-aos="fade-left">
          <Login />
        </div>
      </div>
      <section className="relative w-[95%] xl:w-3/4 mx-auto  mb-20 z-20" data-aos="fade">
        {/* <img
          src="/owl.gif"
          alt=""
          className="absolute h-32 md:h-40  right-3 md:right-5 md:-top-32 -top-24 w-auto"
        /> */}
        <div className="bg-yellow-50 py-5 px-5 lg:px-28 flex items-center gap-5 rounded-t-2xl border-b-2 border-b-gray-200 text-center">
          <img src="/trophy.png" alt="" />
          <p className="font-bold text-base lg:text-xl">
            Top Coders This Month
          </p>
        </div>
        <table className="min-w-full px-10 bg-white rounded-b-2xl overflow-x-scroll shadow-2xl text-sm md:text-base">
          <thead className=" text-center">
            <tr>
              <th className="py-5 lg:px-4 px-2">Rank</th>
              <th className="py-3 lg:px-4 px-2 text-left">Student Name</th>
              <th className="py-3 lg:px-4 px-2">Roll Number</th>
              <th className="py-3 lg:px-4 px-2 sr-only md:not-sr-only">
                Branch
              </th>
              <th className="py-3 lg:px-4 px-2 ">Year</th>

              <th className="py-3 lg:px-4 px-2">Score</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="py-10 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
                  </div>
                </td>
              </tr>
            ) : ranks.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-10 text-center text-gray-500">
                  No ranking data available
                </td>
              </tr>
            ) : (
              ranks.map((s) => (
                <tr key={s.student_id} className="hover:bg-gray-50 text-center">
                  <td className="py-5 px-2 md:px-4 ">
                    <RankBadge rank={s.rank} />
                  </td>
                  <td className="py-3 md:px-4 px-2 text-left flex items-center gap-2">
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
                  <td className="py-3 md:px-4 px-2 sr-only md:not-sr-only">
                    {s.dept_name}
                  </td>
                  <td className="py-3 md:px-4 px-2">{s.year}</td>
                  <td className="py-3 md:px-4 px-2 font-semibold">{s.score}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
      <Footer />
    </div>
  );
}
export default Home;
