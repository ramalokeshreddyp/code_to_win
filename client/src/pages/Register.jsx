import React, { useState, useEffect } from "react";
import { useNavigate, Navigate, Link } from "react-router-dom";
import {
  FiUser,
  FiMail,
  FiHash,
  FiBriefcase,
  FiMonitor,
  FiCheckCircle,
  FiChevronRight,
  FiChevronLeft,
  FiChevronDown,
  FiAward,
  FiCode,
  FiSettings,
  FiArrowRight,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useMeta } from "../context/MetaContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const Register = () => {
  const { depts, years } = useMeta();
  const [sections, setSections] = useState([]);
  const [loadingSections, setLoadingSections] = useState(false);
  const [step, setStep] = useState(1);
  const navi = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [err, setErr] = useState(null);
  const { currentUser } = useAuth();

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

  // Fetch dynamic sections
  useEffect(() => {
    if (formData.dept && formData.year) {
      const fetchSections = async () => {
        setLoadingSections(true);
        try {
          const res = await fetch(
            `/api/meta/sections?dept=${formData.dept}&year=${formData.year}`
          );
          const data = await res.json();
          setSections(data);
        } catch (err) {
          console.error("Failed to fetch sections");
        }
        setLoadingSections(false);
      };
      fetchSections();
    }
  }, [formData.dept, formData.year]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newData = { ...prev, [name]: value };
      if (name === "dept" || name === "year") {
        newData.section = "";
      }
      return newData;
    });
  };

  const handleNext = () => {
    if (step === 1) {
      if (
        !formData.stdId ||
        !formData.name ||
        !formData.email ||
        !formData.gender
      ) {
        setErr("Please fill all fields in Step 1");
        return;
      }
    } else if (step === 2) {
      if (
        !formData.degree ||
        !formData.dept ||
        !formData.year ||
        !formData.section
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
    if (e) e.preventDefault();
    setIsSubmitting(true);
    setErr(null);

    const hasPlatform =
      formData.leetcode ||
      formData.hackerrank ||
      formData.geeksforgeeks ||
      formData.codechef;
    if (!hasPlatform) {
      setErr("Please provide at least one coding profile ID.");
      setIsSubmitting(false);
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
      console.error("Registration error:", error);
      setErr("Connection failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (currentUser) {
    return <Navigate to={`/${currentUser.role}`} replace />;
  }

  const InputWrapper = ({ icon: Icon, label, children }) => (
    <div className="mb-5">
      <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">
        {label}
      </label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          <Icon size={18} />
        </div>
        {children}
      </div>
    </div>
  );

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } },
  };

  const stepItems = [
    { label: "Personal", icon: <FiUser /> },
    { label: "Academic", icon: <FiBriefcase /> },
    { label: "Profiles", icon: <FiCode /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Navbar />

      <main className="flex-grow flex items-center justify-center py-12 px-4 relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-50"></div>
          <div className="absolute top-1/2 -right-24 w-80 h-80 bg-purple-100 rounded-full blur-3xl opacity-50"></div>
        </div>

        <div className="w-full max-w-2xl relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="bg-white/90 backdrop-blur-xl border border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl overflow-hidden"
          >
            {step !== "complete" && (
              <div className="pt-8 px-8">
                {/* Header */}
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
                    Create Account
                  </h1>
                  <p className="text-gray-500">
                    Join the ranking platform and track your growth
                  </p>
                </div>

                {/* Progress Indicator */}
                <div className="flex justify-between items-center mb-10 relative px-4">
                  <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2 z-0"></div>
                  {stepItems.map((item, idx) => {
                    const stepNum = idx + 1;
                    const isActive = step === stepNum;
                    const isCompleted = step > stepNum;

                    return (
                      <div
                        key={idx}
                        className="relative z-10 flex flex-col items-center"
                      >
                        <motion.div
                          animate={{
                            backgroundColor:
                              isCompleted || isActive ? "#2563eb" : "#f1f5f9",
                            scale: isActive ? 1.1 : 1,
                            color: isCompleted || isActive ? "#fff" : "#94a3b8",
                          }}
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-sm transition-colors duration-300`}
                        >
                          {isCompleted ? <FiCheckCircle size={20} /> : stepNum}
                        </motion.div>
                        <span
                          className={`mt-2 text-xs font-bold uppercase tracking-wider ${
                            isActive ? "text-blue-600" : "text-gray-400"
                          }`}
                        >
                          {item.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {err && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded-r-lg"
                  >
                    {err}
                  </motion.div>
                )}
              </div>
            )}

            <div className="p-8 pt-2">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-2"
                  >
                    <InputWrapper icon={FiHash} label="Student ID">
                      <input
                        type="text"
                        name="stdId"
                        value={formData.stdId}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            stdId: e.target.value
                              .trim()
                              .replace(/\s+/g, "")
                              .toUpperCase(),
                          })
                        }
                        placeholder="e.g. 22A91AXXXX"
                        className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-800 placeholder:text-gray-400"
                      />
                    </InputWrapper>

                    <InputWrapper icon={FiUser} label="Full Name">
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="John Doe"
                        className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-800"
                      />
                    </InputWrapper>

                    <InputWrapper icon={FiMail} label="Email Address">
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="john.doe@example.com"
                        className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-800"
                      />
                    </InputWrapper>

                    <div className="mb-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">
                        Gender
                      </label>
                      <div className="flex gap-4">
                        {["Male", "Female"].map((g) => (
                          <label
                            key={g}
                            className={`flex-1 flex items-center justify-center p-3 rounded-xl border-2 cursor-pointer transition-all ${
                              formData.gender === g
                                ? "bg-blue-50 border-blue-500 text-blue-700 font-bold"
                                : "bg-gray-50/50 border-gray-100 text-gray-500 hover:border-gray-200"
                            }`}
                          >
                            <input
                              type="radio"
                              name="gender"
                              value={g}
                              checked={formData.gender === g}
                              onChange={handleChange}
                              className="hidden"
                            />
                            {g}
                          </label>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <InputWrapper icon={FiAward} label="Degree">
                      <select
                        name="degree"
                        value={formData.degree}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none text-gray-800 appearance-none"
                      >
                        <option value="">Select Degree</option>
                        <option value="MCA">
                          Master of Computer Applications (MCA)
                        </option>
                        <option value="B.Tech.">
                          Bachelor of Technology (B.Tech)
                        </option>
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <FiChevronDown />
                      </div>
                    </InputWrapper>

                    <InputWrapper icon={FiBriefcase} label="Department">
                      <select
                        name="dept"
                        value={formData.dept}
                        onChange={handleChange}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none text-gray-800 appearance-none"
                      >
                        <option value="">Select Department</option>
                        {depts.map((dept) => (
                          <option key={dept.dept_code} value={dept.dept_code}>
                            {dept.dept_name}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <FiChevronDown />
                      </div>
                    </InputWrapper>

                    <div className="grid grid-cols-2 gap-4">
                      <InputWrapper icon={FiHash} label="Year">
                        <select
                          name="year"
                          value={formData.year}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none text-gray-800 appearance-none"
                        >
                          <option value="">Select Year</option>
                          {[1, 2, 3, 4].map((y) => (
                            <option key={y} value={y}>
                              Year {y}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                          <FiChevronDown />
                        </div>
                      </InputWrapper>

                      <InputWrapper icon={FiSettings} label="Section">
                        <select
                          name="section"
                          value={formData.section}
                          onChange={handleChange}
                          disabled={loadingSections}
                          className={`w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all outline-none text-gray-800 appearance-none ${
                            loadingSections ? "bg-gray-100 opacity-70" : ""
                          }`}
                        >
                          <option value="">
                            {loadingSections ? "Loading..." : "Select Section"}
                          </option>
                          {sections.map((s) => (
                            <option key={s} value={s}>
                              Section {s}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                          <FiChevronDown />
                        </div>
                      </InputWrapper>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="bg-yellow-50/50 border border-yellow-100 rounded-xl p-4 mb-4">
                      <p className="text-xs font-semibold text-yellow-700 flex items-center gap-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 4,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        >
                          <FiSettings />
                        </motion.div>
                        PRO TIP: Enter only your username, not the complete URL.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InputWrapper icon={FiCode} label="LeetCode ID">
                        <input
                          type="text"
                          name="leetcode"
                          value={formData.leetcode}
                          onChange={handleChange}
                          placeholder="e.g. aditya01"
                          className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-400 text-sm"
                        />
                      </InputWrapper>

                      <InputWrapper icon={FiMonitor} label="HackerRank ID">
                        <input
                          type="text"
                          name="hackerrank"
                          value={formData.hackerrank}
                          onChange={handleChange}
                          placeholder="e.g. aditya02"
                          className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-400 text-sm"
                        />
                      </InputWrapper>

                      <InputWrapper icon={FiBriefcase} label="GFG ID">
                        <input
                          type="text"
                          name="geeksforgeeks"
                          value={formData.geeksforgeeks}
                          onChange={handleChange}
                          placeholder="e.g. aditya03"
                          className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-400 text-sm"
                        />
                      </InputWrapper>

                      <InputWrapper icon={FiUser} label="CodeChef ID">
                        <input
                          type="text"
                          name="codechef"
                          value={formData.codechef}
                          onChange={handleChange}
                          placeholder="e.g. aditya04"
                          className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-400 text-sm"
                        />
                      </InputWrapper>
                    </div>
                  </motion.div>
                )}

                {step === "complete" && (
                  <motion.div
                    key="complete"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center py-12 px-6"
                  >
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 shadow-inner">
                      <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        <FiCheckCircle size={48} />
                      </motion.div>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                      Registration Sent!
                    </h2>
                    <p className="text-gray-600 mb-8 leading-relaxed max-w-sm mx-auto">
                      Great work! We'll process your details shortly and send an
                      email with your login credentials once verified.
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navi("/")}
                      className="inline-flex items-center gap-2 py-3 px-10 rounded-2xl bg-gray-900 text-white font-bold hover:bg-gray-800 transition-all shadow-xl shadow-gray-200"
                    >
                      Back To Home
                      <FiArrowRight />
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>

              {step !== "complete" && (
                <div className="flex items-center justify-between gap-4 pt-8 border-t border-gray-100 mt-8">
                  {step > 1 ? (
                    <button
                      onClick={handlePrevious}
                      disabled={isSubmitting}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-50 text-gray-500 font-bold hover:bg-gray-100 transition-all"
                    >
                      <FiChevronLeft />
                      Back
                    </button>
                  ) : (
                    <div />
                  )}

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={step === 3 ? handleSubmit : handleNext}
                    disabled={isSubmitting}
                    className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold shadow-lg transition-all ${
                      step === 3
                        ? "bg-green-600 text-white shadow-green-100 hover:bg-green-700"
                        : "bg-blue-600 text-white shadow-blue-100 hover:bg-blue-700"
                    }`}
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        {step === 3 ? "Complete Registration" : "Continue"}
                        {step < 3 && <FiChevronRight />}
                      </>
                    )}
                  </motion.button>
                </div>
              )}
            </div>

            <div className="bg-gray-50/50 p-4 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-500">
                Already have an account?{" "}
                <Link
                  to="/"
                  className="text-blue-600 font-bold hover:underline"
                >
                  Sign In
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Register;
