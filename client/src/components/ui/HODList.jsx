import React, { useState, useEffect } from "react";
import {
  FaSearch,
  FaFilter,
  FaEdit,
  FaTrash,
  FaTimes,
  FaSave,
} from "react-icons/fa";
import { useMeta } from "../../context/MetaContext";

const HODList = () => {
  const [hods, setHODs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ dept: "" });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const { depts } = useMeta();

  useEffect(() => {
    fetchHODs();
  }, []);

  const fetchHODs = async () => {
    setLoading(true);
    try {
      let url = "/api/admin/hods";
      if (filters.dept) {
        url += `?dept=${filters.dept}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch HOD data");
      }

      const data = await response.json();
      setHODs(data);
      setError(null);
    } catch (err) {
      setError("Error loading HOD data. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  const applyFilters = (e) => {
    e.preventDefault();
    fetchHODs();
  };

  const startEdit = (hod) => {
    setEditingId(hod.hod_id);
    setEditForm({
      id: hod_id,
      name: hod.name,
      email: hod.email,
      dept_code: hod.dept_code,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleEditChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value,
    });
  };

  const saveEdit = async (id) => {
    try {
      const response = await fetch(`/api/admin/hods/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        throw new Error("Failed to update HOD");
      }

      // Update local state
      setHODs(hods.map((h) => (h.hod_id === id ? { ...h, ...editForm } : h)));

      setEditingId(null);
      setEditForm({});
    } catch (err) {
      console.error("Error updating HOD:", err);
      alert("Failed to update HOD. Please try again.");
    }
  };

  const confirmDelete = (id) => {
    setDeleteConfirm(id);
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  const deleteHOD = async (id) => {
    try {
      const response = await fetch(`/api/admin/hods/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete HOD");
      }

      // Update local state
      setHODs(hods.filter((h) => h.hod_id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      console.error("Error deleting HOD:", err);
      alert("Failed to delete HOD. Please try again.");
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading HOD data...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-10 text-red-600">
        {error}
        <button
          onClick={fetchHODs}
          className="block mx-auto mt-4 bg-blue-600 text-white px-4 py-2 rounded"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 ">
        <h2 className="text-lg font-semibold">HOD List</h2>
        <p className="text-sm text-gray-500">
          View and filter department heads
        </p>
      </div>

      {/* Filters */}
      <div className="p-4  bg-gray-50">
        <form
          onSubmit={applyFilters}
          className="flex flex-wrap items-center gap-4"
        >
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <select
              name="dept"
              value={filters.dept}
              onChange={handleFilterChange}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Departments</option>
              {depts.map((dept) => (
                <option key={dept.dept_code} value={dept.dept_code}>
                  {dept.dept_name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end mt-5">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-700"
            >
              <FaFilter /> Apply Filters
            </button>
          </div>
        </form>
      </div>

      {/* HOD List */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Department
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {hods.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                  No HODs found
                </td>
              </tr>
            ) : (
              hods.map((hod) => (
                <tr key={hod.hod_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === hod.hod_id ? (
                      <input
                        type="text"
                        name="name"
                        value={editForm.id}
                        onChange={handleEditChange}
                        className="border border-gray-300 rounded px-2 py-1 w-full"
                      />
                    ) : (
                      <div className="font-medium text-gray-900">
                        {hod.hod_id}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === hod.hod_id ? (
                      <input
                        type="text"
                        name="name"
                        value={editForm.name}
                        onChange={handleEditChange}
                        className="border border-gray-300 rounded px-2 py-1 w-full"
                      />
                    ) : (
                      <div className="font-medium text-gray-900">
                        {hod.name}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === hod.hod_id ? (
                      <input
                        type="email"
                        name="email"
                        value={editForm.email}
                        onChange={handleEditChange}
                        className="border border-gray-300 rounded px-2 py-1 w-full"
                      />
                    ) : (
                      <div className="text-gray-500">{hod.email}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === hod.hod_id ? (
                      <select
                        name="dept_code"
                        value={editForm.dept_code}
                        onChange={handleEditChange}
                        className="border border-gray-300 rounded px-2 py-1 w-full"
                      >
                        {depts.map((dept) => (
                          <option key={dept.dept_code} value={dept.dept_code}>
                            {dept.dept_name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="text-gray-500">
                        {depts.find((d) => d.dept_code === hod.dept_code)
                          ?.dept_name || hod.dept}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {editingId === hod.hod_id ? (
                      <div className="flex space-x-2 justify-end">
                        <button
                          onClick={() => saveEdit(hod.hod_id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          <FaSave className="w-5 h-5" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          <FaTimes className="w-5 h-5" />
                        </button>
                      </div>
                    ) : deleteConfirm === hod.hod_id ? (
                      <div className="flex space-x-2 justify-end">
                        <button
                          onClick={() => deleteHOD(hod.hod_id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={cancelDelete}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                          <div className="flex space-x-5">
                        <button
                          onClick={() => startEdit(hod)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <FaEdit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => confirmDelete(hod.hod_id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FaTrash className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HODList;
