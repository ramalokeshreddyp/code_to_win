import React, { useState, useEffect } from "react";
import { useMeta } from "../../context/MetaContext";
import { FaUserPlus } from "react-icons/fa6";
import { FiX, FiCheck, FiAlertTriangle } from "react-icons/fi";

const Spinner = () => (
  <svg
    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

// Edit Modal (student info)
export default function EditModal({
  onClose,
  user,
  onSuccess,
  adminView = false,
}) {
  const { depts, years, sections } = useMeta();
  const savedData = {
    name: user.name || "",
    roll: user.student_id || "",
    email: user.email || "",
    year: user.year || "",
    section: user.section || "",
    dept_code: user.dept_code || "",
    degree: user.degree || "",
  };
  const [form, setForm] = useState(savedData);
  const [status, setStatus] = useState({
    loading: false,
    error: null,
    success: false,
  });

  useEffect(() => {
    setForm(savedData);
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: null, success: false });

    // Build payload with only changed fields
    const payload = { userId: user.student_id };
    if (form.name !== savedData.name) payload.name = form.name;
    if (form.email !== savedData.email) payload.email = form.email;

    if (adminView) {
      if (form.year !== savedData.year) payload.year = form.year;
      if (form.section !== savedData.section) payload.section = form.section;
      if (form.dept_code !== savedData.dept_code)
        payload.dept_code = form.dept_code;
      if (form.degree !== savedData.degree) payload.degree = form.degree;
    }

    // If nothing changed, just close
    if (Object.keys(payload).length === 1) {
      setStatus({ loading: false, error: null, success: true });
      setTimeout(() => onClose(), 500);
      return;
    }

    try {
      const endpoint = adminView
        ? "/api/admin/update-student"
        : "/api/student/update-profile";
      const response = await fetch(endpoint, {
        method: adminView ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to update student");
      }
      setStatus({ loading: false, error: null, success: true });
      if (onSuccess) onSuccess();
      setTimeout(() => onClose(), 1000);
    } catch (error) {
      setStatus({ loading: false, error: error.message, success: false });
    }
  };

  const handleCancel = () => {
    setForm(savedData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl md:w-full md:max-w-md w-full p-8 relative transform transition-all scale-100"
        data-aos="fade-in"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <FiX size={24} />
        </button>

        <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <FaUserPlus size={20} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            Edit Personal Information
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-600">
              Full Name
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all bg-gray-50/50 hover:bg-white"
              placeholder="Enter your name"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-600">
              Roll Number
            </label>
            <input
              name="roll"
              value={form.roll}
              disabled
              className="w-full px-4 py-3 border border-gray-100 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-600">
              Email Address
            </label>
            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all bg-gray-50/50 hover:bg-white"
              placeholder="Enter your email"
            />
          </div>

          {adminView ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1 text-sm font-semibold text-gray-600">
                <label>Department</label>
                <select
                  name="dept_code"
                  value={form.dept_code}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500"
                >
                  <option value="">Select</option>
                  {depts.map((dept) => (
                    <option key={dept.dept_code} value={dept.dept_code}>
                      {dept.dept_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1 text-sm font-semibold text-gray-600">
                <label>Year</label>
                <select
                  name="year"
                  value={form.year}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:border-blue-500"
                >
                  <option value="">Select</option>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
              {/* Simplified for admin view inputs to save space */}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-600">
                  Year
                </label>
                <input
                  name="year"
                  value={form.year}
                  disabled
                  className="w-full px-4 py-3 border border-gray-100 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-gray-600">
                  Section
                </label>
                <input
                  name="section"
                  value={form.section}
                  disabled
                  className="w-full px-4 py-3 border border-gray-100 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-2">
            <button
              type="button"
              onClick={handleCancel}
              className="px-5 py-2.5 rounded-xl text-gray-600 font-medium hover:bg-gray-100 transition-colors"
              disabled={status.loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:shadow-blue-500/40 transition-all"
              disabled={status.loading}
            >
              {status.loading ? (
                <span className="flex items-center gap-2">
                  <Spinner /> Saving...
                </span>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>

          {status.error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
              <FiAlertTriangle /> {status.error}
            </div>
          )}
          {status.success && (
            <div className="p-3 bg-green-50 text-green-600 text-sm rounded-lg flex items-center gap-2">
              <FiCheck /> Student updated successfully!
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
