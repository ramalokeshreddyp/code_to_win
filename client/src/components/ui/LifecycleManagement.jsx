import React, { useState } from "react";
import {
  FiTrendingUp,
  FiAward,
  FiUpload,
  FiAlertCircle,
  FiCheckCircle,
} from "react-icons/fi";
import { useMeta } from "../../context/MetaContext";
import axios from "axios";

const LifecycleManagement = ({ fixedDept = "" }) => {
  const { depts, years } = useMeta();
  const [selectedDept, setSelectedDept] = useState(fixedDept || "");
  const [promoteFromYear, setPromoteFromYear] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);

  const handlePromote = async () => {
    if (!selectedDept || !promoteFromYear) {
      alert("Please select both department and year.");
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to promote all active students in ${selectedDept} from Year ${promoteFromYear} to Year ${
          parseInt(promoteFromYear) + 1
        }?`
      )
    ) {
      return;
    }

    setLoading(true);
    setStatus(null);
    try {
      const res = await axios.post("/api/management/promote-batch", {
        dept: selectedDept,
        fromYear: promoteFromYear,
      });
      setStatus({ type: "success", message: res.data.message });
    } catch (err) {
      setStatus({
        type: "error",
        message: err.response?.data?.message || "Promotion failed",
      });
    }
    setLoading(false);
  };

  const handleGraduate = async () => {
    if (!selectedDept) {
      alert("Please select a department.");
      return;
    }

    if (
      !window.confirm(
        `Are you sure you want to mark all Year 4 students in ${selectedDept} as GRADUATED? This action is permanent.`
      )
    ) {
      return;
    }

    setLoading(true);
    setStatus(null);
    try {
      const res = await axios.post("/api/management/graduate-batch", {
        dept: selectedDept,
      });
      setStatus({ type: "success", message: res.data.message });
    } catch (err) {
      setStatus({
        type: "error",
        message: err.response?.data?.message || "Graduation failed",
      });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-8 p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <FiTrendingUp size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Batch Promotions
            </h2>
            <p className="text-gray-500 text-sm">
              Increment student academic years in bulk
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 transition-all">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              Department
            </label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              disabled={!!fixedDept}
              className={`w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all ${
                fixedDept ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              <option value="">Select Department</option>
              {depts.map((d) => (
                <option key={d.dept_code} value={d.dept_code}>
                  {d.dept_name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700">
              Promote From Year
            </label>
            <select
              value={promoteFromYear}
              onChange={(e) => setPromoteFromYear(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            >
              <option value="">Select Year</option>
              {[1, 2, 3].map((y) => (
                <option key={y} value={y}>
                  Year {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={handlePromote}
            disabled={loading || !selectedDept || !promoteFromYear}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-100"
          >
            {loading ? "Processing..." : "Trigger Bulk Promotion"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <FiAward size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Graduation Handling
            </h2>
            <p className="text-gray-500 text-sm">
              Move Year 4 students to Alumni status
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-3 text-amber-800 text-sm">
            <FiAlertCircle className="mt-0.5 flex-shrink-0" />
            <p>
              Graduating students will mark them as inactive for active
              performance tracking and rankings, but their historical data will
              remain preserved.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-semibold text-gray-700">
                Target Department
              </label>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                disabled={!!fixedDept}
                className={`w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all ${
                  fixedDept ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                <option value="">Select Department</option>
                {depts.map((d) => (
                  <option key={d.dept_code} value={d.dept_code}>
                    {d.dept_name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleGraduate}
              disabled={loading || !selectedDept}
              className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-100 whitespace-nowrap"
            >
              {loading ? "Processing..." : "Process Graduation"}
            </button>
          </div>
        </div>
      </div>

      {status && (
        <div
          className={`fixed bottom-8 right-8 p-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in ${
            status.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {status.type === "success" ? <FiCheckCircle /> : <FiAlertCircle />}
          <span className="font-semibold">{status.message}</span>
        </div>
      )}
    </div>
  );
};

export default LifecycleManagement;
