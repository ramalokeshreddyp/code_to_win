import React, { useState } from "react";
import { useMeta } from "../../context/MetaContext";
import { FaUserPlus } from "react-icons/fa6";
import GenericFormModal from "./GenericFormModal";

// Add Branch Modal
export default function AddBranchModal(props) {
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
      {...props}
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
