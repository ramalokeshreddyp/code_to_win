import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  FiActivity,
  FiUsers,
  FiTrendingUp,
  FiClock,
  FiRefreshCw,
} from "react-icons/fi";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
];

const RealTimeDashboard = ({ currentUser }) => {
  const [realTimeData, setRealTimeData] = useState({
    totalStudents: 0,
    totalVisitors: 0,
    activeStudents: 0,
    recentActivity: [],
    performanceUpdates: [],
  });
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Simulate real-time data updates
    const interval = setInterval(() => {
      fetchRealTimeData();
    }, 5000); // Update every 5 seconds

    fetchRealTimeData();
    return () => clearInterval(interval);
  }, []);

  const fetchRealTimeData = async () => {
    try {
      const response = await fetch("/api/admin/analytics/realtime");
      const data = await response.json();
      setRealTimeData(data);
      setIsConnected(true);
    } catch (error) {
      console.error("Failed to fetch real-time data:", error);
      setIsConnected(false);
    }
  };

  const ActivityFeed = ({ activities }) => (
    <div className="space-y-3">
      {activities.map((activity, index) => (
        <div
          key={index}
          className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
        >
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <FiActivity className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900">
              {activity.message}
            </p>
            <p className="text-xs text-gray-500">{activity.timestamp}</p>
          </div>
        </div>
      ))}
    </div>
  );

  const MetricCard = ({ title, value, change, icon, color = "blue" }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {change && (
            <p
              className={`text-sm ${
                change > 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {change > 0 ? "+" : ""}
              {change}% from last hour
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-${color}-50`}>
          <div className={`text-${color}-600 text-xl`}>{icon}</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">
          Real-Time Dashboard
        </h2>
        <div className="flex items-center space-x-2">
          <div
            className={`w-3 h-3 rounded-full ${
              isConnected ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <span className="text-sm text-gray-600">
            {isConnected ? "Connected" : "Disconnected"}
          </span>
          <button
            onClick={fetchRealTimeData}
            className="p-2 text-gray-400 hover:text-gray-600"
          >
            <FiRefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Real-time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <MetricCard
          title="Total Visitors"
          value={realTimeData.totalVisitors}
          icon={<FiUsers />}
          color="green"
        />
        <MetricCard
          title="Active Students"
          value={realTimeData.activeStudents}
          icon={<FiActivity />}
          color="purple"
        />
        <MetricCard
          title="Total Students"
          value={realTimeData.totalStudents}
          icon={<FiUsers />}
          color="blue"
        />
        <MetricCard
          title="Active Faculty"
          value={currentUser.total_faculty}
          icon={<FiUsers />}
          color="orange"
        />
        <MetricCard
          title="Active HODs"
          value={currentUser.total_hod}
          icon={<FiUsers />}
          color="red"
        />
      </div>
    </div>
  );
};

export default RealTimeDashboard;
