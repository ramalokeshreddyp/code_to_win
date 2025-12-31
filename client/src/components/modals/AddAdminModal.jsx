import React, { useState } from "react";
import GenericFormModal from "./GenericFormModal";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const AddAdminModal = ({ isOpen, onClose, onSuccess }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const fields = [
    {
      name: "adminId",
      label: "Admin ID",
      type: "text",
      placeholder: "e.g., AD01",
      required: true,
    },
    {
      name: "name",
      label: "Full Name",
      type: "text",
      placeholder: "e.g., John Doe",
      required: true,
    },
    {
      name: "email",
      label: "Email Address",
      type: "email",
      placeholder: "e.g., john@example.com",
      required: true,
    },
    {
      name: "password",
      label: "Password",
      type: "password",
      placeholder: "••••••••",
      required: true,
    },
  ];

  const handleSubmit = async (formData) => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/admins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          superAdminId: currentUser.user_id,
          ...formData,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create administrator");
      }

      toast.success("Administrator created successfully");
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error creating admin:", error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GenericFormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Add New Administrator"
      fields={fields}
      loading={loading}
    />
  );
};

export default AddAdminModal;
