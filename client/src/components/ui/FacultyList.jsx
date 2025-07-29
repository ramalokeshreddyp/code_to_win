import React, { useState, useEffect } from "react";
import { FaSearch, FaFilter, FaEdit, FaTrash, FaTimes, FaSave } from "react-icons/fa";
import { useMeta } from "../../context/MetaContext";

const FacultyList = () => {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ dept: "" });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const { depts } = useMeta();

  useEffect(() => {
    fetchFaculty();
  }, []);

  const fetchFaculty = async () => {
    setLoading(true);
    try {
      let url = "/api/admin/faculty";
      if (filters.dept) {
        url += `?dept=${filters.dept}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch faculty data");
      }

      const data = await response.json();
      setFaculty(data);
      setError(null);
    } catch (err) {
      setError("Error loading faculty data. Please try again.");
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
    fetchFaculty();
  };
  
  const startEdit = (member) => {
    setEditingId(member.faculty_id);
    setEditForm({
      id: member.faculty_id,
      name: member.name,
      email: member.email,
      dept_code: member.dept_code
    });
  };
  
  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };
  
  const handleEditChange = (e) => {
    setEditForm({
      ...editForm,
      [e.target.name]: e.target.value
    });
  };
  
  const saveEdit = async (id) => {
    try {
      const response = await fetch(`/api/admin/faculty/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update faculty');
      }
      
      // Update local state
      setFaculty(faculty.map(f => 
        f.faculty_id === id ? { ...f, ...editForm } : f
      ));
      
      setEditingId(null);
      setEditForm({});
    } catch (err) {
      console.error('Error updating faculty:', err);
      alert('Failed to update faculty. Please try again.');
    }
  };
  
  const confirmDelete = (id) => {
    setDeleteConfirm(id);
  };
  
  const cancelDelete = () => {
    setDeleteConfirm(null);
  };
  
  const deleteFaculty = async (id) => {
    try {
      const response = await fetch(`/api/admin/faculty/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete faculty');
      }
      
      // Update local state
      setFaculty(faculty.filter(f => f.faculty_id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting faculty:', err);
      alert('Failed to delete faculty. Please try again.');
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading faculty data...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-10 text-red-600">
        {error}
        <button
          onClick={fetchFaculty}
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
        <h2 className="text-lg font-semibold">Faculty List</h2>
        <p className="text-sm text-gray-500">View and filter faculty members</p>
      </div>

      {/* Filters */}
      <div className="p-4">
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

      {/* Faculty List */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left  font-medium text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-3 text-left  font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left  font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left  font-medium text-gray-500 uppercase tracking-wider">
                Department
              </th>
              <th className="px-6 py-3 text-left  font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {faculty.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                  No faculty members found
                </td>
              </tr>
            ) : (
              faculty.map((member) => (
                <tr key={member.faculty_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === member.faculty_id ? (
                      <input
                        type="text"
                        name="name"
                        value={editForm.id}
                        onChange={handleEditChange}
                        className="border border-gray-300 rounded px-2 py-1 w-full"
                      />
                    ) : (
                      <div className="font-medium text-gray-900">{member.faculty_id}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === member.faculty_id ? (
                      <input
                        type="text"
                        name="name"
                        value={editForm.name}
                        onChange={handleEditChange}
                        className="border border-gray-300 rounded px-2 py-1 w-full"
                      />
                    ) : (
                      <div className="font-medium text-gray-900">{member.name}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === member.faculty_id ? (
                      <input
                        type="email"
                        name="email"
                        value={editForm.email}
                        onChange={handleEditChange}
                        className="border border-gray-300 rounded px-2 py-1 w-full"
                      />
                    ) : (
                      <div className="text-gray-500">{member.email}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === member.faculty_id ? (
                      <select
                        name="dept_code"
                        value={editForm.dept_code}
                        onChange={handleEditChange}
                        className="border border-gray-300 rounded px-2 py-1 w-full"
                      >
                        {depts.map(dept => (
                          <option key={dept.dept_code} value={dept.dept_code}>
                            {dept.dept_name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="text-gray-500">
                        {depts.find(d => d.dept_code === member.dept_code)?.dept_name || member.dept_code}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {editingId === member.faculty_id ? (
                      <div className="flex space-x-2 justify-end">
                        <button
                          onClick={() => saveEdit(member.faculty_id)}
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
                    ) : deleteConfirm === member.faculty_id ? (
                      <div className="flex space-x-2 justify-end">
                        <button
                          onClick={() => deleteFaculty(member.faculty_id)}
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
                          onClick={() => startEdit(member)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <FaEdit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => confirmDelete(member.faculty_id)}
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

export default FacultyList;
