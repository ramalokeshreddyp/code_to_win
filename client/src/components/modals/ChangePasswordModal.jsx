import React, { useState } from "react";
import { FiLock, FiX, FiCheck, FiAlertTriangle } from "react-icons/fi";

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

// User Reset Password Modal
export default function UserResetPasswordModal({ onClose, user }) {
  const [form, setForm] = useState({
    password: "",
    confirmPassword: "",
  });
  const [status, setStatus] = useState({
    loading: false,
    error: null,
    success: false,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: null, success: false });

    // Validation
    if (!form.password || !form.confirmPassword) {
      setStatus({
        loading: false,
        error: "Please fill all required fields",
        success: false,
      });
      return;
    }
    if (form.password !== form.confirmPassword) {
      setStatus({
        loading: false,
        error: "Passwords do not match",
        success: false,
      });
      return;
    }

    try {
      const response = await fetch(`/api/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.student_id,
          role: user.role,
          password: form.password,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to reset password");
      }
      setStatus({ loading: false, error: null, success: true });
      setForm({
        password: "",
        confirmPassword: "",
      });
      setTimeout(() => onClose(), 1500);
    } catch (error) {
      setStatus({ loading: false, error: error.message, success: false });
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

        <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
          <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
            <FiLock size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Change Password</h2>
            <p className="text-xs text-gray-500">Secure your account</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-600">
              User ID
            </label>
            <input
              id="userId"
              name="userId"
              type="text"
              value={user.student_id}
              disabled
              className="w-full px-4 py-3 border border-gray-100 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-600">
              New Password
            </label>
            <input
              name="password"
              type="password"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all bg-gray-50/50 hover:bg-white"
              placeholder="Enter new password"
              required
              value={form.password}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-600">
              Confirm Password
            </label>
            <input
              name="confirmPassword"
              type="password"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all bg-gray-50/50 hover:bg-white"
              placeholder="Confirm new password"
              required
              value={form.confirmPassword}
              onChange={handleChange}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-gray-600 font-medium hover:bg-gray-100 transition-colors"
              disabled={status.loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40 hover:from-orange-600 hover:to-red-600 transition-all"
              disabled={status.loading}
            >
              {status.loading ? (
                <span className="flex items-center gap-2">
                  <Spinner /> Updating...
                </span>
              ) : (
                "Update Password"
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
              <FiCheck /> Password changed successfully!
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
