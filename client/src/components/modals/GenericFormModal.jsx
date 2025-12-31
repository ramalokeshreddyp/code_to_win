import React, { useState, useEffect } from "react";
import { FiX, FiCheck, FiAlertTriangle } from "react-icons/fi";

const RequiredLabel = ({ label, htmlFor }) => (
  <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700">
    {label} <span className="text-red-500">*</span>
  </label>
);

// Spinner Component
const Spinner = () => (
  <svg
    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

// Generic Form Modal - Updated Styling
export default function GenericFormModal({
  title,
  fields,
  onSubmit,
  submitLabel = "Submit",
  loading,
  error,
  success,
  onClose,
  icon,
  initialValues = {},
  inline = false, // New prop
  isOpen = true, // Default to true for backward compatibility
}) {
  const [form, setForm] = useState(initialValues);

  useEffect(() => {
    setForm(initialValues);
  }, [initialValues]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // Trigger field-specific onChange if provided
    const field = fields.find((f) => f.name === name);
    if (field?.onChange) {
      field.onChange(value, setForm);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form, setForm);
  };

  const content = (
    <div
      className={`${
        inline
          ? "w-full max-w-4xl"
          : "bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative transform transition-all scale-100"
      }`}
      data-aos={!inline ? "zoom-in" : ""}
    >
      {!inline && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <FiX size={24} />
        </button>
      )}

      <h3 className="text-xl font-bold flex items-center gap-2 mb-6 text-gray-800 border-b border-gray-100 pb-4">
        <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">{icon}</span>
        {title}
      </h3>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {fields.map((field) => (
          <div key={field.name} className="space-y-1">
            {field.label && (
              <label
                htmlFor={field.name}
                className="block text-sm font-semibold text-gray-600"
              >
                {field.label}{" "}
                {field.required && <span className="text-red-500">*</span>}
              </label>
            )}
            {field.type === "select" ? (
              <select
                name={field.name}
                value={form[field.name] || ""}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all bg-gray-50/50 hover:bg-white"
                required={field.required}
                disabled={field.disabled}
              >
                <option value="">{field.placeholder || "Select Option"}</option>
                {field.options?.map((opt) =>
                  typeof opt === "string" ? (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ) : (
                    <option
                      key={opt.value || opt.dept_code}
                      value={opt.value || opt.dept_code}
                    >
                      {opt.label || opt.dept_name}
                    </option>
                  )
                )}
              </select>
            ) : (
              <input
                name={field.name}
                value={form[field.name] || ""}
                onChange={handleChange}
                type={field.type}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all bg-gray-50/50 hover:bg-white placeholder:text-gray-400"
                placeholder={`Enter ${field.label.toLowerCase()}`}
                required={field.required}
                disabled={field.disabled}
              />
            )}
          </div>
        ))}

        <button
          type="submit"
          disabled={loading}
          className={`w-full mt-6 flex justify-center items-center gap-2 py-3.5 rounded-xl text-white font-semibold shadow-lg transition-all transform active:scale-95 ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-blue-500/25"
          }`}
        >
          {loading ? (
            <>
              <Spinner /> Processing...
            </>
          ) : (
            submitLabel
          )}
        </button>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
            <FiAlertTriangle /> {error}
          </div>
        )}
        {success && (
          <div className="p-3 bg-green-50 text-green-600 text-sm rounded-lg flex items-center gap-2">
            <FiCheck /> {success}
          </div>
        )}
      </form>
    </div>
  );

  if (inline) {
    return content;
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      {content}
    </div>
  );
}
