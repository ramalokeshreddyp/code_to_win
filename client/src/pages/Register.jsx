import React, { useState, useCallback } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { FiUser, FiLock, FiEye, FiEyeOff, FiUserCheck } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { useMeta } from "../context/MetaContext";
import { UpdateProfileModal } from "../components/Modals";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const Register = () => {
  const { depts, years, sections } = useMeta();
  const [step, setStep] = useState(1);
  const navi = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [err, setErr] = useState(null);
  const { currentUser } = useAuth();
  // Form data
  const [formData, setFormData] = useState({
    stdId: "",
    name: "",
    email: "",
    gender: "",
    degree: "",
    dept: "",
    year: "",
    section: "",
    leetcode: "",
    hackerrank: "",
    geeksforgeeks: "",
    codechef: "",
  });

  // Handlers
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleNext = () => {
    if (step === 1) {
      if (
        formData.stdId === "" ||
        formData.name === "" ||
        formData.email === ""
      ) {
        setErr("Please fill all fields in Step 1");
        return;
      }
    } else if (step === 2) {
      if (
        formData.degree === "" ||
        formData.dept === "" ||
        formData.year === "" ||
        formData.section === ""
      ) {
        setErr("Please fill all fields in Step 2");
        return;
      }
    }
    setErr(null);
    setStep(step + 1);
  };
  const handlePrevious = () => setStep(step - 1);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErr(null);
    if (
      formData.leetcode === "" &&
      formData.hackerrank === "" &&
      formData.geeksforgeeks === "" &&
      formData.codechef === ""
    ) {
      setErr("Please fill at least one field in Step 3");
      return;
    }
    try {
      const result = await fetch(`/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formData }),
      });
      if (!result.ok) {
        const errorData = await result.json();
        setErr(errorData.message);
        return;
      }

      setStep("complete");
    } catch (error) {
      console.error("Login error:", error);
      setErr(result.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (currentUser) {
    return <Navigate to={`/${currentUser.role}`} replace />;
  }
  return (
    <>
      <Navbar />
      <div className="min-h-[80vh] flex flex-col items-center justify-center py-10">
        <div className="w-full max-w-[90%] md:max-w-[70%] bg-white border flex border-gray-100 shadow rounded-xl">
          <div className="hidden lg:flex flex-1/2 ">
            <img
              src="/reg.jpg"
              alt="registration"
              className="w-full h-auto max-h-[800px] object-cover rounded-l-xl"
            />
          </div>
          {step === "complete" ? (
            <div className="text-center flex-1/2 p-8 flex flex-col justify-center items-centers">
              <div className="text-green-500 mb-4">
                <svg
                  className="mx-auto w-20 h-20"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h2 className="text-2xl  mb-2">Registration Successful!</h2>
              <p className="text-gray-600 mb-6">
                Thank you. We'll process your data shortly and send you a mail
                with your login details. If you did't receive mail, please
                contact us.
              </p>
              <button
                onClick={() => navi("/")}
                className="py-2 px-6 rounded bg-gray-200 hover:bg-gray-300 text-gray-500 font-semibold"
              >
                Back to Home
              </button>
            </div>
          ) : (
            <div className="flex-1/2 p-8 flex flex-col justify-center items-center">
              {isSubmitting ? (
                <div className="flex justify-center items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <>
                  <div className="bg-blue-200 flex justify-center items-center w-30 h-30 p-4 rounded-full">
                    <FiUserCheck className="text-blue-500 text-6xl" />
                  </div>
                  <h1 className="text-2xl font-semibold my-3">Sign Up</h1>
                  {err && <p className="mt-3 text-red-500 text-sm">{err}</p>}
                  <div className="mb-6 w-full">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-500">
                        Step {step} of 3
                      </span>
                      <span className="text-sm text-gray-600">
                        {parseInt(((step - 1) / 3) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{
                          width: `${parseInt(((step - 1) / 3) * 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  {step === 1 && (
                    <>
                      <div className="mb-4 w-full">
                        <label className="block text-gray-500 text-base mb-1">
                          Student ID
                        </label>
                        <input
                          type="text"
                          name="stdId"
                          value={formData.stdId}
                              onChange={handleChange}
                              placeholder="22A91AXXXX"
                              className="w-full border border-gray-200  rounded px-3 py-2 focus:ring-1 focus:outline-0 focus:ring-blue-600"
                        />
                      </div>
                      <div className="mb-4 w-full">
                        <label className="block text-gray-500 mb-1">Name</label>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                              className="w-full border border-gray-200  rounded px-3 py-2 focus:ring-1 focus:outline-0 focus:ring-blue-600"
                        />
                      </div>
                      <div className="mb-4 w-full">
                        <label className="block text-gray-500 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                              className="w-full border border-gray-200  rounded px-3 py-2 focus:ring-1 focus:outline-0 focus:ring-blue-600"
                        />
                      </div>
                      <div className="mb-4 w-full">
                        <label className="block text-gray-500  mb-1">
                          Gender
                        </label>
                        <div className="flex space-x-4 mt-2">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="gender"
                              value="Male"
                              checked={formData.gender === "Male"}
                              onChange={handleChange}
                              className="form-radio h-4 w-4 text-blue-600"
                            />
                            <span className="ml-2 text-gray-500">Male</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name="gender"
                              value="Female"
                              checked={formData.gender === "Female"}
                              onChange={handleChange}
                              className="form-radio h-4 w-4 text-blue-600"
                            />
                            <span className="ml-2 text-gray-500">Female</span>
                          </label>
                        </div>
                      </div>
                    </>
                  )}

                  {step === 2 && (
                    <>
                      <div className="mb-4 w-full">
                        <label className="block text-gray-500  mb-1">
                          Degree
                        </label>
                        <select
                          name="degree"
                          value={formData.degree}
                          onChange={handleChange}
                          className="w-full border border-gray-200 rounded px-3 py-2"
                        >
                          <option value="">Select</option>
                          <option value="MCA">MCA</option>
                              <option value="B.Tech.">B.Tech</option>
                        </select>
                      </div>
                      <div className="mb-4 w-full">
                        <label className="block text-gray-500  mb-1">
                              Department
                        </label>
                        <select
                          name="dept"
                          onChange={handleChange}
                              className="w-full border border-gray-300  hover:bg-blue-50 p-2 rounded-lg transition outline-none"
                          value={formData.dept}
                        >
                          <option value="">Select</option>
                          {depts.map((dept) => (
                            <option key={dept.dept_code} value={dept.dept_code}>
                              {dept.dept_name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="mb-4 w-full">
                        <label className="block text-gray-500  mb-1">
                          Year
                        </label>
                        <select
                          name="year"
                          onChange={handleChange}
                              className="w-full border border-gray-300 hover:bg-blue-50 p-2 rounded-lg transition outline-none"
                          value={formData.year}
                        >
                          <option value="">Select</option>
                          {[1,2,3,4].map((year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="mb-4 w-full">
                        <label className="block text-gray-500  mb-1">
                          Section
                        </label>
                        <select
                          name="section"
                          onChange={handleChange}
                              className="w-full border border-gray-300 hover:bg-blue-50 p-2 rounded-lg transition outline-none"
                          value={formData.section}
                        >
                          <option value="">Select</option>
                          {sections.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}
                  {step === 3 && (
                    <>
                      <p className="text-sm font-semibold text-yellow-500 mb-2">
                        NOTE: Enter only username. Don't enter the complete
                        link.
                      </p>
                      <div className="mb-4 w-full">
                        <label className="block text-gray-500  mb-1">
                          LeetCode ID
                        </label>
                        <input
                          type="text"
                          name="leetcode"
                          value={formData.leetcode}
                              onChange={handleChange}
                              placeholder="(eg: Aditya01)"
                              className="w-full border border-gray-200 rounded px-3 py-2 focus:ring-1 focus:outline-0 focus:ring-blue-600 "
                        />
                      </div>
                      <div className="mb-4 w-full">
                        <label className="block text-gray-500  mb-1">
                          HackerRank ID
                        </label>
                        <input
                          type="text"
                          name="hackerrank"
                          value={formData.hackerrank}
                              onChange={handleChange}
                              placeholder="(eg: Aditya02)"
                              className="w-full border border-gray-200 rounded px-3 py-2 focus:ring-1 focus:outline-0 focus:ring-blue-600"
                        />
                      </div>
                      <div className="mb-4 w-full">
                        <label className="block text-gray-500  mb-1">
                          GeeksforGeeks ID
                        </label>
                        <input
                          type="text"
                          name="geeksforgeeks"
                          value={formData.geeksforgeeks}
                              onChange={handleChange}
                              placeholder="(eg: Aditya03)"
                              className="w-full border border-gray-200 rounded px-3 py-2 focus:ring-1 focus:outline-0 focus:ring-blue-600"
                        />
                      </div>
                      <div className="mb-4 w-full">
                        <label className="block text-gray-500  mb-1">
                          CodeChef ID
                        </label>
                        <input
                          type="text"
                          name="codechef"
                          value={formData.codechef}
                              onChange={handleChange}
                              placeholder="(eg: Aditya04)"
                              className="w-full border border-gray-200 rounded px-3 py-2 focus:ring-1 focus:outline-0 focus:ring-blue-600"
                        />
                      </div>
                    </>
                  )}
                  {/* Buttons */}
                  <div className="flex justify-between gap-4 mt-6">
                    {step > 1 && (
                      <button
                        onClick={handlePrevious}
                        className="py-2 px-6 rounded bg-gray-200 hover:bg-gray-300 text-gray-500 font-semibold"
                      >
                        Previous
                      </button>
                    )}
                    {step < 3 && (
                      <button
                        onClick={handleNext}
                        className="py-2 px-6 rounded bg-blue-500 hover:bg-blue-600 text-white font-semibold ml-auto"
                      >
                        Next
                      </button>
                    )}
                    {step === 3 && (
                      <button
                        onClick={handleSubmit}
                        className="py-2 px-6 rounded bg-green-500 hover:bg-green-600 text-white font-semibold ml-auto"
                      >
                        Complete
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Register;
