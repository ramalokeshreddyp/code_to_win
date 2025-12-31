import React, { useEffect, useState } from "react";
import {
  FiCheck,
  FiX,
  FiExternalLink,
  FiClock,
  FiAward,
  FiAlertCircle,
} from "react-icons/fi";
import { toast } from "react-hot-toast";
import dayjs from "dayjs";

const FacultyApprovals = ({ facultyId }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/achievements/pending?facultyId=${facultyId}`
      );
      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [facultyId]);

  const handleAction = async (id, action) => {
    let rejectionReason = "";
    if (action === "reject") {
      rejectionReason = prompt("Please enter a reason for rejection:");
      if (!rejectionReason) return; // Cancel if no reason
    }

    if (!window.confirm(`Are you sure you want to ${action} this request?`))
      return;

    setProcessing(id);
    try {
      const res = await fetch(`/api/achievements/${id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          facultyId,
          rejectionReason,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(data.message);
        setRequests((prev) => prev.filter((r) => r.id !== id));
      } else {
        toast.error(data.message || "Action failed");
      }
    } catch (err) {
      toast.error("Server error");
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">
        Loading pending requests...
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FiAward className="text-blue-600" /> Pending Approvals
          </h2>
          <p className="text-sm text-gray-500">
            Review student achievement claims
          </p>
        </div>
        <span className="bg-blue-50 text-blue-600 py-1 px-3 rounded-full text-xs font-bold">
          {requests.length} Pending
        </span>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <FiCheck className="mx-auto text-green-500 text-3xl mb-3" />
          <p className="text-gray-600 font-medium">All caught up!</p>
          <p className="text-gray-400 text-sm">
            No pending achievement requests.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {requests.map((req) => (
            <div
              key={req.id}
              className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow bg-white"
            >
              <div className="flex flex-col md:flex-row gap-6">
                {/* Left: Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-gray-100 text-gray-700 font-bold px-2 py-1 rounded text-xs uppercase tracking-wider">
                      {req.type}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <FiClock size={12} />{" "}
                      {dayjs(req.date).format("MMM D, YYYY")}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    {req.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    <span className="font-semibold">{req.org_name}</span>
                    {req.description && (
                      <span className="text-gray-400">
                        {" "}
                        • {req.description}
                      </span>
                    )}
                  </p>

                  <div className="flex items-center gap-2 bg-blue-50/50 p-2 rounded-lg border border-blue-50 w-fit">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600 text-xs">
                      {req.student_name?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-800">
                        {req.student_name}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {req.roll_number} • {req.year}-{req.section}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex flex-col md:flex-row items-start md:items-center gap-3 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6 min-w-[200px]">
                  {req.file_path && (
                    <a
                      href={req.file_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      <FiExternalLink /> View Proof
                    </a>
                  )}

                  <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                    <button
                      onClick={() => handleAction(req.id, "approve")}
                      disabled={processing === req.id}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm flex items-center justify-center gap-2 shadow-sm shadow-green-200"
                    >
                      <FiCheck /> Approve
                    </button>
                    <button
                      onClick={() => handleAction(req.id, "reject")}
                      disabled={processing === req.id}
                      className="flex-1 bg-white border border-gray-200 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                    >
                      <FiX /> Reject
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FacultyApprovals;
