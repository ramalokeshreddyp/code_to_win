import React, { useState, useEffect } from "react";
import {
  FaSearch,
  FaEdit,
  FaTrash,
  FaTimes,
  FaSave,
  FaUserShield,
  FaUserPlus,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";
import AddAdminModal from "../modals/AddAdminModal";

const AdminList = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/admins?userId=${currentUser.user_id}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch administrator data");
      }
      const data = await response.json();
      setAdmins(data);
      setError(null);
    } catch (err) {
      setError("Error loading administrator data. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (admin) => {
    setEditingId(admin.admin_id);
    setEditForm({
      name: admin.name,
      email: admin.email,
      is_active: admin.is_active,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleEditChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditForm({
      ...editForm,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const saveEdit = async (id) => {
    try {
      const response = await fetch(`/api/admin/admins/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          superAdminId: currentUser.user_id,
          ...editForm,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update administrator");
      }

      setAdmins(
        admins.map((admin) =>
          admin.admin_id === id ? { ...admin, ...editForm } : admin
        )
      );
      setEditingId(null);
      setEditForm({});
      toast.success("Administrator updated successfully");
    } catch (err) {
      console.error("Error updating admin:", err);
      toast.error(err.message);
    }
  };

  const deleteAdmin = async (id) => {
    try {
      const response = await fetch(`/api/admin/admins/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ superAdminId: currentUser.user_id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete administrator");
      }

      setAdmins(admins.filter((admin) => admin.admin_id !== id));
      setDeleteConfirm(null);
      toast.success("Administrator deleted successfully");
    } catch (err) {
      console.error("Error deleting admin:", err);
      toast.error(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600 font-medium">
          Loading administrators...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 text-red-600 bg-red-50 rounded-xl border border-red-100 mx-4 my-6">
        <p className="font-semibold">{error}</p>
        <button
          onClick={fetchAdmins}
          className="mt-4 bg-red-600 text-white px-6 py-2 rounded-lg hover:bg-red-700 transition shadow-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FaUserShield className="text-blue-600" />
            Administrator Management
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage administrative access accounts (Super-Admin only)
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-blue-700 transition shadow-sm font-bold"
        >
          <FaUserPlus /> Add Administrator
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr className="bg-gray-50/50">
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {admins.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  className="px-6 py-12 text-center text-gray-400 italic"
                >
                  No administrators found.
                </td>
              </tr>
            ) : (
              admins.map((admin) => (
                <tr
                  key={admin.admin_id}
                  className="hover:bg-blue-50/30 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
                    {admin.admin_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === admin.admin_id ? (
                      <input
                        type="text"
                        name="name"
                        value={editForm.name}
                        onChange={handleEditChange}
                        className="border border-gray-300 rounded-lg px-3 py-1.5 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      />
                    ) : (
                      <div className="text-sm font-medium text-gray-900">
                        {admin.name}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === admin.admin_id ? (
                      <input
                        type="email"
                        name="email"
                        value={editForm.email}
                        onChange={handleEditChange}
                        className="border border-gray-300 rounded-lg px-3 py-1.5 w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      />
                    ) : (
                      <div className="text-sm text-gray-500">{admin.email}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === admin.admin_id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="is_active"
                          checked={editForm.is_active}
                          onChange={handleEditChange}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-600">Active</span>
                      </div>
                    ) : (
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold leading-5 ${
                          admin.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {admin.is_active ? "Active" : "Inactive"}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {editingId === admin.admin_id ? (
                      <div className="flex space-x-3 justify-end">
                        <button
                          onClick={() => saveEdit(admin.admin_id)}
                          className="text-green-600 hover:text-green-900 bg-green-50 p-2 rounded-lg transition"
                          title="Save"
                        >
                          <FaSave className="w-5 h-5" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-gray-500 hover:text-gray-900 bg-gray-100 p-2 rounded-lg transition"
                          title="Cancel"
                        >
                          <FaTimes className="w-5 h-5" />
                        </button>
                      </div>
                    ) : deleteConfirm === admin.admin_id ? (
                      <div className="flex space-x-3 justify-end items-center">
                        <span className="text-xs text-red-600 font-bold mr-2 animate-pulse">
                          Confirm delete?
                        </span>
                        <button
                          onClick={() => deleteAdmin(admin.admin_id)}
                          className="bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition text-xs shadow-sm"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="text-gray-500 hover:text-gray-900 text-xs px-2 py-1 bg-gray-100 rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex space-x-3 justify-end">
                        <button
                          onClick={() => startEdit(admin)}
                          className="text-blue-600 hover:text-blue-700 bg-blue-50 p-2 rounded-lg transition"
                          title="Edit"
                        >
                          <FaEdit className="w-4 h-4" />
                        </button>
                        {admin.admin_id !== "SA07" &&
                          admin.admin_id !== "ADMIN" && (
                            <button
                              onClick={() => setDeleteConfirm(admin.admin_id)}
                              className="text-red-500 hover:text-red-600 bg-red-50 p-2 rounded-lg transition"
                              title="Delete"
                            >
                              <FaTrash className="w-4 h-4" />
                            </button>
                          )}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <AddAdminModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchAdmins}
      />
    </div>
  );
};

export default AdminList;
