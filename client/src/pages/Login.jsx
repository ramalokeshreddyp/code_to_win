import React, { useState, useCallback } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { FiUser, FiLock, FiEye, FiEyeOff, FiUserCheck } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

const ROLES = ["student", "faculty", "hod", "admin"];

const Login = () => {
  const [formData, setFormData] = useState({
    userId: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState(ROLES[0]);
  const [err, setErr] = useState(null);
  const { login, currentUser } = useAuth();
  const navigate = useNavigate();

  if (currentUser) {
    return <Navigate to={`/${currentUser.role}`} replace />;
  }

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr(null);
    setIsSubmitting(true);
    // console.log(formData.userId, formData.password, selectedRole);
    try {
      const result = await login(
        formData.userId,
        formData.password,
        selectedRole
      );
      if (result.success) {
        navigate(`/${result.role || selectedRole}`);
      } else {
        setErr(result.message);
      }
    } catch (error) {
      console.error("Login error:", error);
      setErr(result.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = (role) => {
    setSelectedRole(role);
  };
  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };
  return (
    <div className=" pt-16 flex items-center justify-center px-4 py-12">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Login to CodeTracker
          </h1>
          <p className="text-gray-600 mt-2">
            Access your dashboard based on your role
          </p>
          {err && <p className="mt-3 text-red-500 text-sm">{err}</p>}
        </div>

        {/* Role selection */}
        <div className="mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-1">
            {ROLES.map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => handleRoleChange(role)}
                className={`px-4 py-2 rounded-md capitalize text-sm font-medium transition-colors ${
                  selectedRole === role
                    ? "bg-blue-100 text-blue-700 border-2 border-blue-500"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent"
                }`}
              >
                {role}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Select your role to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div>
            <label
              htmlFor="userId"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              User ID
            </label>
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiUser className="text-gray-400" />
              </div>
              <input
                id="userId"
                type="username"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pl-10"
                placeholder="22A91XXXX"
                autoComplete="username"
                onChange={(e) => handleChange("userId", e.target.value.trim().replace(/\s+/g, '').toUpperCase())}
              />
            </div>
          </div>
          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiLock className="text-gray-400" />
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pl-10 pr-10"
                placeholder="••••••••"
                autoComplete="current-password"
                onChange={(e) => handleChange("password", e.target.value)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full inline-flex items-center justify-center px-4 py-2 font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Signing in...
              </div>
            ) : (
              <div className="flex items-center">
                <FiUserCheck className="mr-2" />
                Sign in
              </div>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
