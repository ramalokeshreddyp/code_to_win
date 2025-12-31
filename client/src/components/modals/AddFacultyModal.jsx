import React, { useState } from "react";
import { useMeta } from "../../context/MetaContext";
import { FaUserPlus } from "react-icons/fa6";
import GenericFormModal from "./GenericFormModal";

// Add Faculty Modal
export default function AddFacultyModal(props) {
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
      {...props}
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
