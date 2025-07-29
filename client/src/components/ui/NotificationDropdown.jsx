import React, { useState, useEffect } from "react";
import { FiBell, FiCheck, FiX, FiPause } from "react-icons/fi";
import { useAuth } from "../../context/AuthContext";

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { currentUser } = useAuth();

  const fetchNotifications = async () => {
    try {
      const endpoint =
        currentUser.role === "student"
          ? `/api/student/notifications?userId=${
              currentUser.student_id || currentUser.user_id
            }`
          : `/api/faculty/notifications?userId=${
              currentUser.faculty_id || currentUser.user_id
            }`;

      const res = await fetch(endpoint);
      const data = await res.json();
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.read).length);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  const markAsRead = async (notificationId) => {
    // Don't mark faculty pending requests as read
    if (
      currentUser.role === "faculty" &&
      notificationId === "pending-requests"
    ) {
      return;
    }

    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: "PUT",
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const clearAllNotifications = async () => {
    try {
      const endpoint = `/api/notifications/clear?userId=${
        currentUser.student_id || currentUser.faculty_id || currentUser.user_id
      }`;
      await fetch(endpoint, { method: "DELETE" });
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to clear notifications:", err);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const getStatusIcon = (status) => {
    switch (status) {
      case "accepted":
        return <FiCheck className="text-green-500" />;
      case "rejected":
        return <FiX className="text-red-500" />;
      case "suspended":
        return <FiPause className="text-yellow-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-blue-600 focus:outline-none"
      >
        <FiBell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50" data-aos="fade">
          <div className="px-3 py-2 border-b border-gray-300 flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">Notifications</h3>
            {notifications.length > 0 && (
              <button
                onClick={clearAllNotifications}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Clear All
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 border-b border-gray-300 hover:bg-gray-50 ${
                    currentUser.role === "faculty" &&
                    notification.id === "pending-requests"
                      ? "cursor-default"
                      : "cursor-pointer"
                  } ${!notification.read ? "bg-blue-50" : ""}`}
                  onClick={() => {
                    if (
                      currentUser.role !== "faculty" ||
                      notification.id !== "pending-requests"
                    ) {
                      !notification.read && markAsRead(notification.id);
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    {getStatusIcon(notification.status)}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notification.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
