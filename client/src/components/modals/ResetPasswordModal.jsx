import React, { useState } from "react";

// Reset Password Modal (Admin)
export default function ResetPasswordModal() {
  const [status, setStatus] = useState({
    loading: false,
    error: null,
    success: null,
  });
  const [form, setForm] = useState({
    userId: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, error: null, success: null });
    if (!form.userId || !form.password || !form.confirmPassword) {
      setStatus({
        loading: false,
        error: "Please fill all required fields",
        success: null,
      });
      return;
    }
    if (form.password !== form.confirmPassword) {
      setStatus({
        loading: false,
        error: "Passwords do not match",
        success: null,
      });
      return;
    }
    try {
      const response = await fetch(`/api/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: form.userId,
          password: form.password,
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to reset password");
      setStatus({
        loading: false,
        error: null,
        success: "Password reset successful!",
      });
      setForm({
        userId: "",
        password: "",
        confirmPassword: "",
      });
    } catch (error) {
      setStatus({ loading: false, error: error.message, success: null });
    }
  };

  return (
    <div className="w-full">
      <h2 className="text-lg font-semibold mb-4">Reset Password</h2>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <input
          id="userId"
          name="userId"
          type="text"
          className="w-full border rounded px-3 py-2"
          placeholder="User ID "
          required
          value={form.userId}
          onChange={handleChange}
        />
        <input
          name="password"
          type="password"
          className="w-full border rounded px-3 py-2"
          placeholder="New Password "
          required
          value={form.password}
          onChange={handleChange}
        />
        <input
          name="confirmPassword"
          type="password"
          className="w-full border rounded px-3 py-2"
          placeholder="Confirm Password "
          required
          value={form.confirmPassword}
          onChange={handleChange}
        />
        <div className="flex justify-between mt-4">
          <button
            type="submit"
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded"
            disabled={status.loading}
          >
            {status.loading ? "Processing..." : "Reset Password"}
          </button>
        </div>
        {status.error && (
          <div className="text-red-500 text-sm mt-2">{status.error}</div>
        )}
        {status.success && (
          <div className="text-green-500 text-sm mt-2">{status.success}</div>
        )}
      </form>
    </div>
  );
}
