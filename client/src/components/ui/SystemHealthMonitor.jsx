import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts";
import {
  FiServer,
  FiDatabase,
  FiWifi,
  FiCpu,
  FiHardDrive,
  FiActivity,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
  FiClock,
} from "react-icons/fi";

const SystemHealthMonitor = () => {
  const [healthData, setHealthData] = useState({
    systemStatus: "checking...",
    uptime: "0s",
    responseTime: 0,
    activeConnections: 0,
    databaseStatus: "unknown",
    lastBackup: "unknown",
    errorRate: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    diskUsage: 0,
  });

  const [performanceHistory, setPerformanceHistory] = useState([]);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    fetchSystemHealth();
    const interval = setInterval(fetchSystemHealth, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchSystemHealth = async () => {
    try {
      const res = await fetch("/api/admin/analytics/system-health");
      if (!res.ok) throw new Error("Health check failed");

      const realData = await res.json();

      setHealthData(realData);

      // Create a time label for the chart
      const timeLabel = new Date().toLocaleTimeString("en-US", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

      setPerformanceHistory((prev) => {
        const newHistory = [
          ...prev,
          {
            time: timeLabel,
            responseTime: realData.responseTime,
            activeConnections: realData.activeConnections,
            memoryUsage: realData.memoryUsage, // Map memory to chart if needed
          },
        ];
        return newHistory.slice(-20); // Keep last 20 data points
      });

      // Clear old alerts and set new ones based on real thresholds
      const newAlerts = [];
      if (realData.activeConnections > 150) {
        newAlerts.push({
          id: Date.now(),
          type: "warning",
          message: `High connection load: ${realData.activeConnections}`,
          timestamp: timeLabel,
        });
      }
      if (realData.responseTime > 500) {
        newAlerts.push({
          id: Date.now() + 1,
          type: "error",
          message: `Slow DB response: ${realData.responseTime}ms`,
          timestamp: timeLabel,
        });
      }

      if (newAlerts.length > 0) {
        setAlerts((prev) => [...newAlerts, ...prev].slice(0, 5));
      }
    } catch (error) {
      console.error("Failed to fetch system health:", error);
      // Optional: Set visual error state
      setHealthData((prev) => ({
        ...prev,
        systemStatus: "error",
        databaseStatus: "disconnected",
      }));
    }
  };

  const StatusIndicator = ({ status, label }) => {
    const getStatusColor = (status) => {
      switch (status) {
        case "healthy":
        case "connected":
          return "text-green-600 bg-green-100";
        case "warning":
        case "slow":
          return "text-yellow-600 bg-yellow-100";
        case "error":
        case "disconnected":
          return "text-red-600 bg-red-100";
        default:
          return "text-gray-600 bg-gray-100";
      }
    };

    const getStatusIcon = (status) => {
      switch (status) {
        case "healthy":
        case "connected":
          return <FiCheckCircle className="w-4 h-4" />;
        case "warning":
        case "slow":
          return <FiAlertTriangle className="w-4 h-4" />;
        case "error":
        case "disconnected":
          return <FiXCircle className="w-4 h-4" />;
        default:
          return <FiActivity className="w-4 h-4" />;
      }
    };

    return (
      <div
        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
          status
        )}`}
      >
        {getStatusIcon(status)}
        <span className="ml-2">{label}</span>
      </div>
    );
  };

  const MetricCard = ({ icon, title, value, unit, status, color = "blue" }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg bg-${color}-50`}>
          <div className={`text-${color}-600 text-xl`}>{icon}</div>
        </div>
        {status && <StatusIndicator status={status} label={status} />}
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
        <div className="text-2xl font-semibold text-gray-900">
          {value}
          {unit && <span className="text-sm text-gray-500 ml-1">{unit}</span>}
        </div>
      </div>
    </div>
  );

  const UsageBar = ({ label, value, max = 100, color = "blue" }) => (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm text-gray-500">{value}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`bg-${color}-600 h-2 rounded-full transition-all duration-300`}
          style={{ width: `${Math.min(value, max)}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          icon={<FiServer />}
          title="System Status"
          value={healthData.systemStatus}
          status={healthData.systemStatus}
          color="green"
        />
        <MetricCard
          icon={<FiClock />}
          title="Uptime"
          value={healthData.uptime}
          color="blue"
        />
        <MetricCard
          icon={<FiActivity />}
          title="Response Time"
          value={healthData.responseTime}
          unit="ms"
          color="purple"
        />
        <MetricCard
          icon={<FiWifi />}
          title="Active Connections"
          value={healthData.activeConnections}
          color="orange"
        />
      </div>

      {/* Performance Charts and System Resources */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance History */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Performance History
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="responseTime"
                stroke="#3B82F6"
                strokeWidth={2}
                name="Response Time (ms)"
              />
              <Line
                type="monotone"
                dataKey="activeConnections"
                stroke="#10B981"
                strokeWidth={2}
                name="Connections"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* System Resources */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            System Resources
          </h3>
          <div className="space-y-4">
            <UsageBar
              label="CPU Usage"
              value={healthData.cpuUsage}
              color={
                healthData.cpuUsage > 80
                  ? "red"
                  : healthData.cpuUsage > 60
                  ? "yellow"
                  : "green"
              }
            />
            <UsageBar
              label="Memory Usage"
              value={healthData.memoryUsage}
              color={
                healthData.memoryUsage > 85
                  ? "red"
                  : healthData.memoryUsage > 70
                  ? "yellow"
                  : "green"
              }
            />
            <UsageBar
              label="Disk Usage"
              value={healthData.diskUsage}
              color={
                healthData.diskUsage > 90
                  ? "red"
                  : healthData.diskUsage > 75
                  ? "yellow"
                  : "green"
              }
            />
          </div>

          {/* Additional System Info */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Database:</span>
                <StatusIndicator
                  status={healthData.databaseStatus}
                  label={healthData.databaseStatus}
                />
              </div>
              <div>
                <span className="text-gray-500">Last Backup:</span>
                <span className="ml-2 font-medium">
                  {healthData.lastBackup}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Error Rate:</span>
                <span className="ml-2 font-medium">
                  {healthData.errorRate}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resource Usage Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Resource Usage Over Time
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={performanceHistory}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="cpuUsage"
              stackId="1"
              stroke="#3B82F6"
              fill="#3B82F6"
              fillOpacity={0.6}
              name="CPU %"
            />
            <Area
              type="monotone"
              dataKey="memoryUsage"
              stackId="2"
              stroke="#10B981"
              fill="#10B981"
              fillOpacity={0.6}
              name="Memory %"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Alerts
          </h3>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border-l-4 ${
                  alert.type === "error"
                    ? "bg-red-50 border-red-400"
                    : "bg-yellow-50 border-yellow-400"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {alert.type === "error" ? (
                      <FiXCircle className="w-5 h-5 text-red-600 mr-3" />
                    ) : (
                      <FiAlertTriangle className="w-5 h-5 text-yellow-600 mr-3" />
                    )}
                    <span className="font-medium text-gray-900">
                      {alert.message}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {alert.timestamp}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemHealthMonitor;
