import React, { useState } from "react";
import { useMeta } from "../../context/MetaContext";
import { FaUserPlus } from "react-icons/fa6";
import GenericFormModal from "./GenericFormModal";

// Add Individual Student Modal
export default function AddIndividualStudentModel({ onSuccess, ...props }) {
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
      !form.degree
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
      });
      if (onSuccess) onSuccess();
    } catch (error) {
      setStatus({ loading: false, error: error.message, success: null });
    }
  };

  return (
    <GenericFormModal
      {...props}
      title="Add Individual Student"
      icon={<FaUserPlus className="w-4 h-4" />}
      fields={[
        { name: "name", label: "Student Name", type: "text", required: true },
        { name: "stdId", label: "Roll Number", type: "text", required: true },
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
      }}
    />
  );
}
