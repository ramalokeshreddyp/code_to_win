import React, { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { TbSend } from "react-icons/tb";

const ContactUs = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState({
    loading: false,
    success: null,
    error: null,
  });

  const faqs = [
    {
      question: "How is the score calculated?",
      answer:
        "The score is calculated based on problem difficulty, with harder problems weighted more heavily. We also consider contest participation and platform-specific ratings.",
    },
    {
      question: "How often is the data updated?",
      answer:
        "The data is updated whenever new profiles are uploaded by administrators. Student performance data syncs weekly.",
    },
  ];

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, success: null, error: null });

    // Simple validation
    if (!form.name || !form.email || !form.message) {
      setStatus({
        loading: false,
        success: null,
        error: "Please fill in all fields.",
      });
      return;
    }

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({
          loading: false,
          success: data.message || "Message sent successfully!",
          error: null,
        });
        setForm({ name: "", email: "", message: "" });
      } else {
        setStatus({
          loading: false,
          success: null,
          error: data.message || "Failed to send message. Please try again.",
        });
      }
    } catch (error) {
      setStatus({
        loading: false,
        success: null,
        error: "Network error. Please check your connection and try again.",
      });
    }
  };

  return (
    <>
      <Navbar />
      <section className="px-4 py-8 md:px-12 lg:px-24 xl:px-36 md:py-12 flex flex-col md:flex-row md:gap-12 lg:gap-24 xl:gap-36 min-h-[88vh] justify-center items-center">
        {/* Left Column */}
        <div className="w-full md:w-1/2 mb-10 md:mb-0">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Contact Us
          </h2>
          <p className="text-gray-600 mb-8">
            Have questions about the Coding Tracker ? We'd love to hear
            from you. Fill out the form or reach out through any of the contact
            methods below.
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <i className="fas fa-envelope mt-1 text-gray-600"></i>
              <div>
                <p className="font-medium text-gray-800">codetracker.contact@gmail.com</p>
                <p className="text-sm text-gray-500">
                  We'll respond within 24 hours
                </p>
              </div>
            </div>
          </div>

          {/* Office Hours */}
          <div className="mt-8 md:mt-10">
            <h3 className="font-semibold text-lg text-gray-800 mb-2">
              Office Hours
            </h3>
            <div className="bg-gray-100 p-4 rounded-lg text-sm text-gray-700">
              <p className="font-medium">
                Monday - Friday
                <br />
                10:00 AM - 4:00 PM
              </p>
              <p className="mt-2 text-xs text-gray-500">
                Responses may be delayed outside of office hours
              </p>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="w-full md:w-1/2">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-md p-4 sm:p-6">
            <h3 className="text-lg md:text-xl font-semibold mb-4">
              Send Us Feedback
            </h3>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block  font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  className="mt-1 w-full border border-gray-300 rounded p-3 focus:ring-2 focus:ring-blue-600 outline-0"
                  disabled={status.loading}
                />
              </div>
              <div>
                <label className="block  font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="text"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Your email address"
                  className="mt-1 w-full border border-gray-300 rounded p-3 focus:ring-2 focus:ring-blue-600 outline-0"
                  disabled={status.loading}
                />
              </div>
              <div>
                <label className="block  font-medium text-gray-700">
                  Message
                </label>
                <textarea
                  rows="4"
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  placeholder="How can we help you?"
                  className="mt-1 w-full border border-gray-300 rounded p-3 focus:ring-2 focus:ring-blue-600 outline-0"
                  disabled={status.loading}
                ></textarea>
              </div>
              <button
                type="submit"
                className="bg-blue-600 text-white py-2 px-4 rounded flex items-center justify-center w-full gap-2 hover:bg-blue-700 transition disabled:opacity-60"
                disabled={status.loading}
              >
                {status.loading ? (
                  <span>Sending...</span>
                ) : (
                  <>
                    <TbSend /> Send Message
                  </>
                )}
              </button>
              {status.error && (
                <div className="text-red-600 text-sm mt-2">{status.error}</div>
              )}
              {status.success && (
                <div className="text-green-600 text-sm mt-2">
                  {status.success}
                </div>
              )}
            </form>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
};

export default ContactUs;
