import React, { useState } from "react";
import { FaUserMinus } from "react-icons/fa6";
import DeleteConfirmModal from "./DeleteConfirmModal";

// Spinner Component
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

// Delete Individual Student Modal
export default function DeleteIndividualStudentModal({ onSuccess }) {
  const [user, setUser] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [formData, setFormData] = useState({ userId: "" });
  const [status, setStatus] = useState({
    loading: false,
    error: null,
    success: null,
  });

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.userId) {
      setStatus({
        loading: false,
        error: "Please enter a roll number",
        success: null,
      });
      return;
    }
    try {
      const response = await fetch(
        `/api/student/profile?userId=${formData.userId}`
      );
      if (!response.ok) throw new Error("Failed to fetch user profile");
      setUser(await response.json());
      setConfirmDelete(true);
    } catch (error) {
      setStatus({
        loading: false,
        error: "Error fetching user profile.",
        success: null,
      });
    }
  };

  return (
    <>
      {confirmDelete && (
        <DeleteConfirmModal
          onClose={() => setConfirmDelete(false)}
          user={user}
          onSuccess={onSuccess}
        />
      )}
      <div className="bg-white p-4 md:p-6 rounded shadow">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Delete Student</h2>
        <p className="text-sm text-gray-500 mb-6">
          Delete a student from the system
        </p>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium mb-1">
              Roll Number
            </label>
            <input
              id="userId"
              value={formData.userId}
              onChange={(e) => handleChange("userId", e.target.value)}
              type="text"
              placeholder="Enter roll number"
              className="w-full border border-gray-50 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-600"
            />
          </div>
          <button
            type="submit"
            disabled={status.loading}
            className={`w-full mt-4 flex justify-center items-center gap-2 ${
              status.loading ? "bg-red-300" : "bg-red-500"
            } text-white font-medium py-2 rounded hover:bg-red-600 transition`}
          >
            {status.loading ? (
              <>
                <Spinner />
                Processing...
              </>
            ) : (
              <>
                <FaUserMinus className="w-4 h-4" />
                Delete Student
              </>
            )}
          </button>
          {status.error && (
            <div className="text-red-500 text-sm mt-2">{status.error}</div>
          )}
          {status.success && (
            <div className="text-green-500 text-sm mt-2">{status.success}</div>
          )}
        </form>
      </div>
    </>
  );
}
