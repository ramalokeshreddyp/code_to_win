import React, { useState } from "react";
import {
  FiX,
  FiUploadCloud,
  FiFileText,
  FiCalendar,
  FiCheckCircle,
} from "react-icons/fi";
import { toast } from "react-hot-toast";

const AchievementModal = ({ onClose, onSuccess, studentId }) => {
  const [formData, setFormData] = useState({
    type: "certification",
    subtype: "",
    title: "",
    orgName: "",
    date: "",
    description: "",
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error("Please upload a proof document/image.");
      return;
    }

    setLoading(true);
    const data = new FormData();
    data.append("studentId", studentId);
    data.append("type", formData.type);
    if (formData.type === "hackathon") {
      data.append("subtype", formData.subtype || "participation");
    }
    data.append("title", formData.title);
    data.append("orgName", formData.orgName);
    data.append("date", formData.date);
    data.append("description", formData.description);
    data.append("file", file);

    try {
      const res = await fetch("/api/achievements/add", {
        method: "POST",
        body: data,
      });
      const result = await res.json();

      if (!res.ok) throw new Error(result.message || "Failed to submit");

      toast.success("Achievement submitted successfully!");
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 transition-all"
      data-aos="fade-in"
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl relative overflow-hidden transform transition-all"
        data-aos="zoom-in"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
          >
            <FiX size={24} />
          </button>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FiFileText /> Add Achievement
          </h2>
          <p className="text-blue-100 text-sm mt-1">
            Upload certificates, hackathon wins, or workshop details.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-4 max-h-[75vh] overflow-y-auto"
        >
          {/* Type Selection */}
          <div className="grid grid-cols-3 gap-3">
            {["certification", "hackathon", "workshop"].map((t) => (
              <div
                key={t}
                onClick={() => setFormData({ ...formData, type: t })}
                className={`cursor-pointer border-2 rounded-xl p-3 text-center transition-all ${
                  formData.type === t
                    ? "border-blue-500 bg-blue-50 text-blue-700 font-semibold"
                    : "border-gray-100 text-gray-500 hover:bg-gray-50"
                }`}
              >
                <span className="capitalize text-sm">{t}</span>
              </div>
            ))}
          </div>

          {/* Subtype for Hackathons */}
          {formData.type === "hackathon" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Participation Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.subtype}
                onChange={(e) =>
                  setFormData({ ...formData, subtype: e.target.value })
                }
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-gray-50/50"
                required
              >
                <option value="">Select Type</option>
                <option value="participation">Participation</option>
                <option value="winner">Winner (1st/2nd/3rd)</option>
              </select>
            </div>
          )}

          {/* Inputs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="e.g. Google Cloud Hero"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization
              </label>
              <input
                type="text"
                name="orgName"
                value={formData.orgName}
                onChange={handleChange}
                required
                placeholder="e.g. Google, MLH"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <div className="relative">
                <FiCalendar className="absolute left-3 top-3.5 text-gray-400" />
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="2"
              placeholder="Short description of what you did..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all resize-none"
            />
          </div>

          {/* File Upload */}
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors relative group">
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="flex flex-col items-center justify-center text-gray-500">
              {file ? (
                <>
                  <FiCheckCircle className="text-green-500 text-3xl mb-2" />
                  <span className="text-sm font-medium text-gray-800">
                    {file.name}
                  </span>
                  <span className="text-xs text-green-600">File selected</span>
                </>
              ) : (
                <>
                  <FiUploadCloud className="text-blue-500 text-3xl mb-2 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-gray-700">
                    Click to upload proof
                  </span>
                  <span className="text-xs text-gray-400 mt-1">
                    Image or PDF (Max 5MB)
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-gray-600 font-medium hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-blue-600 text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:bg-blue-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AchievementModal;
