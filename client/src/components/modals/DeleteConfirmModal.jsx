import React, { useState } from "react";
import { CiCircleCheck } from "react-icons/ci";

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

// Delete Confirm Modal
export default function DeleteConfirmModal({ onClose, user, onSuccess }) {
  const [success, setSuccess] = useState(false);
  const [status, setStatus] = useState({
    loading: false,
    error: null,
    success: null,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: null, success: null });
    try {
      const response = await fetch(`/api/delete-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.student_id, role: "student" }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to delete student");
      setStatus({
        loading: false,
        error: null,
        success: "Student deleted successfully!",
      });
      if (onSuccess) onSuccess();
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500); // Close modal after 1.5 seconds
    } catch (error) {
      setStatus({ loading: false, error: error.message, success: null });
    }
  };

  if (success) {
    return (
      <div
        className="fixed inset-0 bg-black/50 flex justify-center items-center z-50"
        onClick={onClose}
      >
        <div className="bg-white rounded-lg shadow-lg w-full max-w-fit flex flex-col items-center justify-center p-6">
          <CiCircleCheck className="text-green-500 text-5xl" />
          Student Deleted Successfully!
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-sm p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-xl font-bold text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          &times;
        </button>
        <h2 className="text-xl font-semibold mb-2">Personal Information</h2>
        <form onSubmit={handleSubmit} className="space-y-2">
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            name="name"
            disabled
            value={user?.name}
            className="flex-1 border border-blue-50 rounded px-2 py-1 w-full"
            placeholder="Name"
          />
          <label className="block text-sm font-medium mb-1">Roll Number</label>
          <input
            name="roll"
            value={user?.student_id}
            disabled
            className="flex-1 border border-blue-100 rounded px-2 py-1 w-full cursor-not-allowed"
            placeholder="Registration Number"
          />
          <label className="block text-sm font-medium mb-1">Year</label>
          <input
            name="year"
            value={user?.year}
            disabled
            className="flex-1 border border-blue-100 rounded px-2 py-1 w-full cursor-not-allowed"
            placeholder="Year"
          />
          <label className="block text-sm font-medium mb-1">Section</label>
          <input
            name="section"
            value={user?.section}
            disabled
            className="flex-1 border border-blue-100 rounded px-2 py-1 w-full cursor-not-allowed"
            placeholder="Section"
          />
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
              <>Confirm Delete</>
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
    </div>
  );
}
