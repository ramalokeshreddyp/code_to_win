import React, { useState } from "react";
import { FaUpload } from "react-icons/fa6";
import { useMeta } from "../../context/MetaContext";
const RequiredLabel = ({ label, htmlFor }) => (
  <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700">
    {label} <span className="text-red-500">*</span>
  </label>
);

const SAMPLE_CSV_DATA = `Student Id,Student Name,Student Email,Gender,CGPA,HackerRank,LeetCode,CodeChef,GeeksforGeeks
22A91A6182,Pavan G,example@aditya.in,Male,8.5,gollapalli_shan1,gspavan07,gpavan07,gollapallishn85u`;

const downloadSampleCSV = () => {
  const blob = new Blob([SAMPLE_CSV_DATA], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.setAttribute("hidden", "");
  a.setAttribute("href", url);
  a.setAttribute("download", "student_bulk_template.csv");
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

const bulkImportWithCP = ({ onSuccess }) => {
  const { depts, years, sections } = useMeta();
  const [bulkFormData, setBulkFormData] = useState({
    dept: "",
    year: "",
    section: "",
    file: null,
  });
  const [bulkUploadStatus, setBulkUploadStatus] = useState({
    loading: false,
    error: null,
    success: false,
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [uploadStats, setUploadStats] = useState(null);

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
    setModalOpen(true); // Open modal when upload starts
    setUploadStats(null);

    if (
      !bulkFormData.dept ||
      !bulkFormData.year ||
      !bulkFormData.section ||
      !bulkFormData.file
    ) {
      setBulkUploadStatus({
        loading: false,
        error: "Please fill all required fields",
        success: false,
      });
      setModalOpen(false);
      return;
    }

    const formData = new FormData();
    formData.append("dept", bulkFormData.dept);
    formData.append("year", bulkFormData.year);
    formData.append("section", bulkFormData.section);
    formData.append("file", bulkFormData.file);

    try {
      const response = await fetch(`/api/bulk-import-with-cp`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      // Set stats for modal
      setUploadStats({
        total: data.totalProcessed,
        success: data.successful,
        failed: data.failed,
        errors: data.errors || [],
      });

      if (!response.ok) {
        throw new Error(data.errors?.[0]?.error || "Failed to import students");
      }

      setBulkUploadStatus({
        loading: false,
        error: null,
        success: true,
      });

      // Reset form
      setBulkFormData({
        dept: "",
        year: "",
        section: "",
        file: null,
      });

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error importing students:", error);
      setBulkUploadStatus({
        loading: false,
        error: error.message,
        success: false,
      });
      setUploadStats({
        total: 0,
        success: 0,
        failed: 0,
        errors: [{ error: error.message }],
      });
    }
  };

  // Modal component
  const UploadModal = () => (
    <div
      className="fixed inset-0 bg-black/10 flex items-center justify-center z-50"
      style={{ display: modalOpen ? "flex" : "none" }}
    >
      <div className="bg-white rounded-lg shadow-lg p-6 min-w-[320px] max-w-[90vw]">
        <h3 className="text-lg font-semibold mb-4">
          {bulkUploadStatus.loading ? "Processing Upload..." : "Upload Summary"}
        </h3>
        {bulkUploadStatus.loading ? (
          <div className="flex flex-col items-center">
            <svg
              className="animate-spin h-8 w-8 text-blue-600 mb-2"
              viewBox="0 0 24 24"
            >
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
            <span className="text-gray-700">
              Please wait while we process your upload...
            </span>
          </div>
        ) : (
          <div>
            <div className="mb-2">
              <strong>Total Students:</strong> {uploadStats?.total ?? "-"}
            </div>
            <div className="mb-2 text-green-600">
              <strong>Successfully Added:</strong> {uploadStats?.success ?? "-"}
            </div>
            <div className="mb-2 text-red-600">
              <strong>Failed:</strong> {uploadStats?.failed ?? "-"}
            </div>
            {uploadStats?.errors && uploadStats.errors.length > 0 && (
              <div className="max-h-32 overflow-y-auto mt-2 text-xs text-red-500">
                <strong>Errors:</strong>
                <ul className="list-disc ml-5">
                  {uploadStats.errors.map((err, idx) => (
                    <li key={idx}>{err.error}</li>
                  ))}
                </ul>
              </div>
            )}
            <button
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => setModalOpen(false)}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="w-full">
      <UploadModal />

      <form className="space-y-4" onSubmit={handleBulkSubmit}>
        <div>
          <RequiredLabel label="Branch" htmlFor="Branch" />
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
          <RequiredLabel label="Year" htmlFor="year" />
          <select
            value={bulkFormData.year}
            onChange={(e) => handleBulkFormChange("year", e.target.value)}
            className="w-full border-blue-50 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select year</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
                {year === 1
                  ? "st"
                  : year === 2
                  ? "nd"
                  : year === 3
                  ? "rd"
                  : "th"}
              </option>
            ))}
          </select>
        </div>

        <div>
          <RequiredLabel label="Section" htmlFor="section" />
          <select
            value={bulkFormData.section}
            onChange={(e) => handleBulkFormChange("section", e.target.value)}
            className="w-full border-blue-50 border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select section</option>
            {sections.map((section) => (
              <option key={section} value={section}>
                {section}
              </option>
            ))}
          </select>
        </div>

        <div>
          <RequiredLabel label="Choose CSV file" htmlFor="choose CSV file" />

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
              Upload Students
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
            Students upload successfully!
          </div>
        )}
      </form>
    </div>
  );
};

export default bulkImportWithCP;
