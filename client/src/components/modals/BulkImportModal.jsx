import React, { useState } from "react";
import BulkImportWithCP from "../ui/BulkImportWithCP";
import BulkImportFaculty from "../ui/BulkImportFaculty";

// Bulk Import Modal
export default function BulkImportModal() {
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
