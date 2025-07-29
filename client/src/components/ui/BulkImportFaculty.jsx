import React, { useState } from "react";
import { FaUpload } from "react-icons/fa6";
import { useMeta } from "../../context/MetaContext";

const SAMPLE_CSV_DATA = `Faculty Id,	Faculty Name,	Faculty Branch,	Faculty Incharge Section,	Faculty Incharge Year,	Faculty Email
104,	Lalu Prasad,	AIML,	A,	2,	example@adityauniversity.in
142,	Kumar,	CSE,	B,	3,	example@adityauniversity.in`;

const downloadSampleCSV = () => {
  const blob = new Blob([SAMPLE_CSV_DATA], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.setAttribute("hidden", "");
  a.setAttribute("href", url);
  a.setAttribute("download", "faculty_bulk_template.csv");
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

const BulkImportFaculty = ({ onSuccess }) => {
  const { depts } = useMeta();
  const [bulkFormData, setBulkFormData] = useState({
    dept: "",
    file: null,
  });
  const [bulkUploadStatus, setBulkUploadStatus] = useState({
    loading: false,
    error: null,
    success: false,
  });

  const handleBulkFormChange = (field, value) => {
    setBulkFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && !file.name.endsWith(".csv")) {
      setBulkUploadStatus({
        loading: false,
        error: "Please upload a CSV file",
        success: false,
      });
      return;
    }
    setBulkFormData((prev) => ({
      ...prev,
      file: file,
    }));
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    setBulkUploadStatus({ loading: true, error: null, success: false });

    if (!bulkFormData.dept || !bulkFormData.file) {
      setBulkUploadStatus({
        loading: false,
        error: "Please fill all required fields",
        success: false,
      });
      return;
    }

    const formData = new FormData();
    formData.append("dept", bulkFormData.dept);
    formData.append("file", bulkFormData.file);

    try {
      const response = await fetch(`/api/bulk-import-faculty`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.errors[0].error || "Failed to import faculty");
      }

      setBulkUploadStatus({
        loading: false,
        error: null,
        success: true,
      });

      // Reset form
      setBulkFormData({
        dept: "",
        file: null,
      });

      // Call success callback
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error importing faculty:", error);
      setBulkUploadStatus({
        loading: false,
        error: error.message,
        success: false,
      });
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleBulkSubmit}>
      <div>
        <label className="block text-sm font-medium mb-1">Branch *</label>
        <select
          value={bulkFormData.dept}
          onChange={(e) => handleBulkFormChange("dept", e.target.value)}
          className="w-full border-blue-50 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select branch</option>
          {depts?.map((dept) => (
            <option key={dept.dept_code} value={dept.dept_code}>
              {dept.dept_name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Choose CSV File *
        </label>
        <div className="space-y-2">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="w-full bg-gray-100 border-gray-200 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>CSV Template:</span>
            <button
              type="button"
              onClick={downloadSampleCSV}
              className="text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
            >
              Download Template
            </button>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={bulkUploadStatus.loading}
        className={`w-full mt-4 flex justify-center items-center gap-2 ${
          bulkUploadStatus.loading ? "bg-green-500" : "bg-green-600"
        } text-white font-medium py-2 rounded hover:bg-green-700 transition`}
      >
        {bulkUploadStatus.loading ? (
          <>
            <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Uploading...
          </>
        ) : (
          <>
            <FaUpload className="w-4 h-4" />
            Upload Faculty
          </>
        )}
      </button>

      {bulkUploadStatus.error && (
        <div className="text-red-500 text-sm mt-2">
          {bulkUploadStatus.error}
        </div>
      )}
      {bulkUploadStatus.success && (
        <div className="text-green-500 text-sm mt-2">
          Faculty upload successfully!
        </div>
      )}
    </form>
  );
};

export default BulkImportFaculty;
