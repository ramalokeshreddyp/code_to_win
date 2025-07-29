import React, { useState, useEffect } from "react";
import { useMeta } from "../context/MetaContext";
import BulkImportWithCP from "./ui/BulkImportWithCP";
import BulkImportFaculty from "./ui/BulkImportFaculty";
import { FaUserMinus, FaUserPlus } from "react-icons/fa6";
import { CiCircleCheck } from "react-icons/ci";
const RequiredLabel = ({ label, htmlFor }) => (
  <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700">
    {label} <span className="text-red-500">*</span>
  </label>
);
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

// Generic Form Modal
function GenericFormModal({
  title,
  fields,
  onSubmit,
  submitLabel = "Submit",
  loading,
  error,
  success,
  onClose,
  icon,
  initialValues = {},
}) {
  const [form, setForm] = useState(initialValues);

  useEffect(() => {
    setForm(initialValues);
  }, [initialValues]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form, setForm);
  };

  return (
    <div className="w-full">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <h3 className="flex items-center gap-2">
          {icon}
          {title}
        </h3>
        {fields.map((field) => (
          <div key={field.name}>
            {field.label && (
              <RequiredLabel label={field.label} htmlFor={field.name} />
            )}
            {field.type === "select" ? (
              <select
                name={field.name}
                value={form[field.name] || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-200 rounded"
                required={field.required}
                disabled={field.disabled}
              >
                <option value="">{field.placeholder || "Select"}</option>
                {field.options?.map((opt) =>
                  typeof opt === "string" ? (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ) : (
                    <option
                      key={opt.value || opt.dept_code}
                      value={opt.value || opt.dept_code}
                    >
                      {opt.label || opt.dept_name}
                    </option>
                  )
                )}
              </select>
            ) : (
              <input
                name={field.name}
                value={form[field.name] || ""}
                onChange={handleChange}
                type={field.type}
                className="w-full px-3 py-2 border border-gray-200 rounded"
                placeholder={`Enter  ${field.label}`}
                required={field.required}
                disabled={field.disabled}
              />
            )}
          </div>
        ))}
        <button
          type="submit"
          disabled={loading}
          className={`w-full mt-4 flex justify-center items-center gap-2 ${
            loading ? "bg-blue-400" : "bg-blue-600"
          } text-white font-medium py-2 rounded hover:bg-blue-700 transition`}
        >
          {loading ? (
            <>
              <Spinner />
              Processing...
            </>
          ) : (
            <>
              {icon}
              {submitLabel}
            </>
          )}
        </button>
        {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
        {success && (
          <div className="text-green-500 text-sm mt-2">{success}</div>
        )}
      </form>
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-2 right-3 text-2xl text-gray-600 hover:text-black cursor-pointer"
        >
          x
        </button>
      )}
    </div>
  );
}

// Add Branch Modal
export function AddBranchModal() {
  const { refreshMeta } = useMeta();
  const [status, setStatus] = useState({
    loading: false,
    error: null,
    success: null,
  });

  const handleSubmit = async (form, setForm) => {
    setStatus({ loading: true, error: null, success: null });
    if (!form.dept_code || !form.dept_name) {
      setStatus({
        loading: false,
        error: "Please fill all required fields",
        success: null,
      });
      return;
    }
    try {
      const response = await fetch(`/api/add-branch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to add dept");
      setStatus({
        loading: false,
        error: null,
        success: "Department added successfully!",
      });
      setForm({ dept_code: "", dept_name: "" });
      if (refreshMeta) refreshMeta();
    } catch (error) {
      setStatus({ loading: false, error: error.message, success: null });
    }
  };

  return (
    <GenericFormModal
      title="Add Branch"
      icon={<FaUserPlus className="w-4 h-4" />}
      fields={[
        {
          name: "dept_code",
          label: "Department Code",
          placeholder: "e.g. A6,A0",
          type: "text",
          required: true,
        },
        {
          name: "dept_name",
          label: "Department Name",
          placeholder: "e.g. AIML,CSE",
          type: "text",
          required: true,
        },
      ]}
      onSubmit={handleSubmit}
      loading={status.loading}
      error={status.error}
      success={status.success}
      initialValues={{ dept_code: "", dept_name: "" }}
    />
  );
}

// Add Individual Student Modal
export function AddIndividualStudentModel({ onSuccess }) {
  const { depts, years, sections } = useMeta();
  const [status, setStatus] = useState({
    loading: false,
    error: null,
    success: null,
  });

  const handleSubmit = async (form, setForm) => {
    setStatus({ loading: true, error: null, success: null });
    if (
      !form.name ||
      !form.stdId ||
      !form.dept ||
      !form.year ||
      !form.section ||
      !form.degree ||
      !form.cgpa
    ) {
      setStatus({
        loading: false,
        error: "Please fill all required fields",
        success: null,
      });
      return;
    }
    try {
      const response = await fetch(`/api/add-student`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to add student");
      setStatus({
        loading: false,
        error: null,
        success: "Student added successfully!",
      });
      setForm({
        name: "",
        stdId: "",
        dept: "",
        year: "",
        section: "",
        degree: "",
        cgpa: "",
      });
      if (onSuccess) onSuccess();
    } catch (error) {
      setStatus({ loading: false, error: error.message, success: null });
    }
  };

  return (
    <GenericFormModal
      title="Add Individual Student"
      icon={<FaUserPlus className="w-4 h-4" />}
      fields={[
        { name: "name", label: "Student Name", type: "text", required: true },
        { name: "stdId", label: "Roll Number", type: "text", required: true },
        { name: "cgpa", label: "CGPA", type: "text", required: true },
        {
          name: "degree",
          label: "Degree",
          type: "select",
          required: true,
          options: ["B.Tech", "MCA"],
        },
        {
          name: "dept",
          label: "Branch",
          type: "select",
          required: true,
          options:
            depts?.map((dept) => ({
              value: dept.dept_code,
              label: dept.dept_name,
            })) || [],
        },
        {
          name: "year",
          label: "Year",
          type: "select",
          required: true,
          options: years.map((year) => ({
            value: year,
            label: `${year}`,
          })),
        },
        {
          name: "section",
          label: "Section",
          type: "select",
          required: true,
          options: sections,
        },
      ]}
      onSubmit={handleSubmit}
      loading={status.loading}
      error={status.error}
      success={status.success}
      initialValues={{
        name: "",
        stdId: "",
        dept: "",
        year: "",
        section: "",
        degree: "",
        cgpa: "",
      }}
    />
  );
}

// Add Faculty Modal
export function AddFacultyModal() {
  const { depts } = useMeta();
  const [status, setStatus] = useState({
    loading: false,
    error: null,
    success: null,
  });

  const handleSubmit = async (form, setForm) => {
    setStatus({ loading: true, error: null, success: null });
    if (!form.name || !form.facultyId || !form.email || !form.dept) {
      setStatus({
        loading: false,
        error: "Please fill all required fields",
        success: null,
      });
      return;
    }
    try {
      const response = await fetch(`/api/add-faculty`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Failed to add faculty");
      setStatus({
        loading: false,
        error: null,
        success: "Faculty added successfully!",
      });
      setForm({
        name: "",
        facultyId: "",
        email: "",
        dept: "",
      });
    } catch (error) {
      setStatus({ loading: false, error: error.message, success: null });
    }
  };

  return (
    <GenericFormModal
      title="Add New Faculty"
      icon={<FaUserPlus className="w-4 h-4" />}
      fields={[
        { name: "name", label: "Faculty Name", type: "text", required: true },
        {
          name: "facultyId",
          label: "Employee ID",
          type: "text",
          required: true,
        },
        { name: "email", label: "Email", type: "email", required: true },
        {
          name: "dept",
          label: "Department",
          type: "select",
          required: true,
          options:
            depts?.map((dept) => ({
              value: dept.dept_code,
              label: dept.dept_name,
            })) || [],
        },
      ]}
      onSubmit={handleSubmit}
      loading={status.loading}
      error={status.error}
      success={status.success}
      initialValues={{
        name: "",
        facultyId: "",
        email: "",
        dept: "",
      }}
    />
  );
}

// Add HOD Modal
export function AddHODModal() {
  const { depts } = useMeta();
  const [status, setStatus] = useState({
    loading: false,
    error: null,
    success: null,
  });

  const handleSubmit = async (form, setForm) => {
    setStatus({ loading: true, error: null, success: null });
    if (!form.name || !form.hodId || !form.email || !form.dept) {
      setStatus({
        loading: false,
        error: "Please fill all required fields",
        success: null,
      });
      return;
    }
    try {
      const response = await fetch(`/api/add-hod`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to add hod");
      setStatus({
        loading: false,
        error: null,
        success: "HOD added successfully!",
      });
      setForm({
        name: "",
        hodId: "",
        email: "",
        dept: "",
      });
    } catch (error) {
      setStatus({ loading: false, error: error.message, success: null });
    }
  };

  return (
    <GenericFormModal
      title="Add New HOD"
      icon={<FaUserPlus className="w-4 h-4" />}
      fields={[
        { name: "name", label: "HOD Name", type: "text", required: true },
        { name: "hodId", label: "Employee ID", type: "text", required: true },
        { name: "email", label: "Email", type: "email", required: true },
        {
          name: "dept",
          label: "Department",
          type: "select",
          required: true,
          options:
            depts?.map((dept) => ({
              value: dept.dept_code,
              label: dept.dept_name,
            })) || [],
        },
      ]}
      onSubmit={handleSubmit}
      loading={status.loading}
      error={status.error}
      success={status.success}
      initialValues={{
        name: "",
        hodId: "",
        email: "",
        dept: "",
      }}
    />
  );
}

// Delete Confirm Modal
export function DeleteConfirmModal({ onClose, user, onSuccess }) {
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

// Delete Individual Student Modal
export function DeleteIndividualStudentModal({ onSuccess }) {
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

// Reset Password Modal
export function ResetPasswordModal() {
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

// Bulk Import Modal
export function BulkImportModal() {
  const [importType, setImportType] = useState("");

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Bulk Import Users</h2>
        <form className="space-y-4">
          <select
            className=" px-3 py-2 border border-gray-200 rounded"
            required
            value={importType}
            onChange={(e) => setImportType(e.target.value)}
          >
            <option value="">Select Import Type</option>
            <option value="student">Student</option>
            <option value="faculty">Faculty</option>
          </select>
        </form>
      </div>
      {importType === "" && (
        <div className="p-10 border border-gray-200 flex justify-center items-center rounded-2xl">
          <p className="text-gray-600">Please Select the type of import</p>
        </div>
      )}
      {importType === "student" && (
        <div className="p-10 border border-gray-200 flex flex-col rounded-2xl">
          <p className="text-2xl text-gray-800">Student Bulk Upload</p>
          <BulkImportWithCP />
        </div>
      )}
      {importType === "faculty" && (
        <div className="p-10 border border-gray-200 flex flex-col rounded-2xl">
          <p className="text-2xl text-gray-800">Faculty Bulk Upload</p>
          <BulkImportFaculty />
        </div>
      )}
    </div>
  );
}

// Edit Modal (student info)
export function EditModal({ onClose, user, onSuccess }) {
  const savedData = {
    name: user.name || "",
    roll: user.student_id || "",
    email: user.email || "",
    year: user.year || "",
    section: user.section || "",
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

    // If nothing changed, just close
    if (Object.keys(payload).length === 1) {
      setStatus({ loading: false, error: null, success: true });
      setTimeout(() => onClose(), 500);
      return;
    }

    try {
      const response = await fetch(`/api/student/update-profile`, {
        method: "PUT",
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
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div
        className="bg-white rounded-lg shadow-lg md:w-full md:max-w-sm w-xs p-6 relative"
        data-aos="fade-in"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-xl font-bold text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          &times;
        </button>
        <h2 className="text-xl font-semibold mb-2">Personal Information</h2>
        <form onSubmit={handleSubmit} className="space-y-2">
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className="flex-1 border border-gray-300 rounded px-2 py-1 w-full focus:ring-2 focus:ring-blue-600 focus:outline-0"
            placeholder="Name"
          />
          <input
            name="roll"
            value={form.roll}
            disabled
            className="flex-1 border border-gray-300 rounded px-2 py-1 w-full cursor-not-allowed"
            placeholder="Registration Number"
          />
          <input
            name="year"
            value={form.year}
            disabled
            className="flex-1 border border-gray-300 rounded px-2 py-1 w-full cursor-not-allowed"
            placeholder="Year"
          />
          <input
            name="section"
            value={form.section}
            disabled
            className="flex-1 border border-gray-300 rounded px-2 py-1 w-full cursor-not-allowed"
            placeholder="Section"
          />
          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            className="flex-1 border border-gray-300 rounded px-2 py-1 w-full focus:ring-2 focus:ring-blue-600 focus:outline-0 "
            placeholder="Email"
          />
          <div className="flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100 cursor-pointer"
              disabled={status.loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 cursor-pointer flex items-center gap-2"
              disabled={status.loading}
            >
              {status.loading ? (
                <>
                  <Spinner />
                  Saving...
                </>
              ) : (
                "Save"
              )}
            </button>
          </div>
          {status.error && (
            <div className="text-red-500 text-sm mt-2">{status.error}</div>
          )}
          {status.success && (
            <div className="text-green-500 text-sm mt-2">
              Student updated successfully!
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

// Coding Profile Update Modal
const optionList = [
  { label: "Leetcode", key: "leetcode" },
  { label: "CodeChef", key: "codechef" },
  { label: "GeeksforGeeks", key: "geeksforgeeks" },
  { label: "HackerRank", key: "hackerrank" },
];

export function UpdateProfileModal({ onClose, onSuccess, user }) {
  console.log("UpdateProfileModal user:", user);
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
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div
        className="bg-white rounded-xl p-6 md:w-full md:max-w-sm w-xs shadow-lg relative"
        data-aos="fade-in"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-xl font-bold text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          &times;
        </button>
        <h2 className="text-xl font-semibold mb-2 text-center">
          Profile Links
        </h2>
        <p className="text-sm text-gray-500 mb-4 text-center">
          Add or update your coding platform links
        </p>
        <form onSubmit={handleSave}>
          <div className="flex flex-col gap-2 mb-4">
            {optionList.map((opt) => (
              <React.Fragment key={opt.key}>
                <label htmlFor={opt.key}>{opt.label}</label>
                <input
                  type="text"
                  id={opt.key}
                  placeholder={`Enter ${opt.label} Username`}
                  value={usernames[opt.key]}
                  onChange={(e) => handleChange(opt.key, e.target.value)}
                  className="flex-1 border border-blue-50 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </React.Fragment>
            ))}
          </div>
          {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
          {success && (
            <div className="text-green-500 text-sm mb-2">
              Coding profiles updated!
            </div>
          )}
          <div className="flex justify-between gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1 rounded border border-gray-300 bg-gray-100 hover:bg-gray-200"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// User Reset Password Modal
export function UserResetPasswordModal({ onClose, user }) {
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
    } catch (error) {
      setStatus({ loading: false, error: error.message, success: false });
    }
  };
  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div
        className="bg-white rounded-lg shadow-lg md:w-full md:max-w-sm w-xs p-6 relative"
        data-aos="fade-in"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-xl font-bold text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          &times;
        </button>
        <h2 className="text-lg font-semibold mb-4">Reset Password</h2>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            id="userId"
            name="userId"
            type="text"
            className="flex-1 border border-blue-50 rounded px-2 py-1 w-full"
            placeholder="User ID *"
            value={user.student_id}
            disabled
          />
          <input
            name="password"
            type="password"
            className="flex-1 border border-blue-50 rounded px-2 py-1 w-full"
            placeholder="New Password *"
            required
            value={form.password}
            onChange={handleChange}
          />
          <input
            name="confirmPassword"
            type="password"
            className="flex-1 border border-blue-50 rounded px-2 py-1 w-full"
            placeholder="Confirm Password *"
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
            <div className="text-green-500 text-sm mt-2">
              Password reset successful!
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
