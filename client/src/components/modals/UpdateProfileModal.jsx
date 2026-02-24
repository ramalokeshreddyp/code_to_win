import React, { useState, useEffect } from "react";
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

// Coding Profile Update Modal
const optionList = [
  { label: "Leetcode", key: "leetcode" },
  { label: "CodeChef", key: "codechef" },
  { label: "GeeksforGeeks", key: "geeksforgeeks" },
  { label: "HackerRank", key: "hackerrank" },
  { label: "GitHub", key: "github" },
];

export default function UpdateProfileModal({ onClose, onSuccess, user }) {
  const initialUsernames = optionList.reduce((acc, opt) => {
    acc[opt.key] = user.coding_profiles?.[`${opt.key}_id`] || "";
    return acc;
  }, {});
  const [usernames, setUsernames] = useState(initialUsernames);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setUsernames(initialUsernames);
    // eslint-disable-next-line
  }, [user]);

  const handleChange = (key, value) => {
    setUsernames((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    // Build payload with only changed usernames
    const payload = { userId: user.student_id };
    optionList.forEach((opt) => {
      const prev = user.coding_profiles?.[`${opt.key}_id`] || "";
      const curr = usernames[opt.key] || "";
      if (prev !== curr) {
        payload[`${opt.key}_id`] = curr;
      }
    });

    // If nothing changed, just close
    if (Object.keys(payload).length === 1) {
      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 500);
      return;
    }

    try {
      const response = await fetch(`/api/student/coding-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update coding profiles");
      }

      setSuccess(true);
      setTimeout(() => {
        setLoading(false);
        onSuccess();
        onClose();
      }, 1000);
    } catch (err) {
      setLoading(false);
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div
        className="bg-white rounded-2xl p-8 md:w-full md:max-w-md w-full shadow-2xl relative transform transition-all scale-100"
        data-aos="fade-in"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <FiX size={24} />
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaUserPlus size={24} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Connect Profiles</h2>
          <p className="text-sm text-gray-500 mt-1">
            Link your coding accounts to track standard progress
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto px-1">
            {optionList.map((opt) => (
              <div
                key={opt.key}
                className="bg-gray-50 p-3 rounded-xl border border-gray-100 hover:border-blue-200 transition-colors"
              >
                <label
                  className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block"
                  htmlFor={opt.key}
                >
                  {opt.label}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    id={opt.key}
                    placeholder={`e.g. username_123`}
                    value={usernames[opt.key]}
                    onChange={(e) => handleChange(opt.key, e.target.value)}
                    className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-medium"
                  />
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
              <FiAlertTriangle /> {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-green-50 text-green-600 text-sm rounded-lg flex items-center gap-2">
              <FiCheck /> Profiles connected successfully!
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-gray-600 font-medium hover:bg-gray-100 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold shadow-lg shadow-blue-500/30 hover:bg-blue-700 hover:shadow-blue-500/40 transition-all"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Spinner /> Saving...
                </span>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
