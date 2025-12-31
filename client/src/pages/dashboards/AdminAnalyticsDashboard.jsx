import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useMeta } from "../../context/MetaContext";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import {
  FiUsers,
  FiActivity,
  FiRefreshCw,
  FiServer,
  FiBriefcase,
  FiAward,
} from "react-icons/fi";
import toast from "react-hot-toast";
import InteractiveDashboard from "../../components/ui/InteractiveDashboard";
import SystemHealthMonitor from "../../components/ui/SystemHealthMonitor";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
];

const AdminAnalyticsDashboard = () => {
  const { currentUser } = useAuth();
  const { depts } = useMeta();
  const [loading, setLoading] = useState(true);
  const [kpiData, setKpiData] = useState({
    metrics: {},
    departmentDistribution: [],
  });
  const [performanceData, setPerformanceData] = useState([]);

  useEffect(() => {
    fetchRealTimeData();
    const interval = setInterval(fetchRealTimeData, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchRealTimeData = async () => {
    try {
      const [kpiRes, perfRes] = await Promise.all([
        fetch("/api/admin/analytics/realtime-kpi"),
        fetch("/api/admin/analytics/performance-graph?dept=all"),
      ]);

      if (!kpiRes.ok || !perfRes.ok) throw new Error("Failed to fetch data");

      const kpi = await kpiRes.json();
      const perf = await perfRes.json();

      setKpiData(kpi);
      setPerformanceData(perf);
      setLoading(false);
    } catch (error) {
      console.error("Analytics fetch error:", error);
      toast.error("Failed to sync real-time data");
      setLoading(false);
    }
  };

  const StatCard = ({ icon, title, value, color = "blue" }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
      <div
        className={`p-3 rounded-lg bg-${color}-50 text-${color}-600 text-2xl`}
      >
        {icon}
      </div>
      <div>
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        <p className="text-sm text-gray-600">{title}</p>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FiRefreshCw className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Syncing real-time analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-fit bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Live Analytics Dashboard
            </h1>
            <p className="text-gray-600 mt-2 flex items-center">
              <span className="relative flex h-3 w-3 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
              </span>
              System Live • Updates every 30s
            </p>
          </div>
          <button
            onClick={() => {
              setLoading(true);
              fetchRealTimeData();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center transition-colors shadow-sm"
          >
            <FiRefreshCw className="mr-2" />
            Sync Now
          </button>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            icon={<FiActivity />}
            title="Total Visitors"
            value={kpiData.metrics.total_visitors}
            color="purple"
          />
          <StatCard
            icon={<FiUsers />}
            title="Active Students"
            value={kpiData.metrics.active_students}
            color="green"
          />
          <StatCard
            icon={<FiBriefcase />}
            title="Total Students"
            value={kpiData.metrics.total_students}
            color="blue"
          />
          <StatCard
            icon={<FiAward />}
            title="Active Faculty"
            value={kpiData.metrics.active_faculty}
            color="orange"
          />
          <StatCard
            icon={<FiServer />}
            title="Active HODs"
            value={kpiData.metrics.active_hods}
            color="red"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Department Distribution */}
          <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Department Distribution
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={kpiData.departmentDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    nameKey="dept_name"
                  >
                    {kpiData.departmentDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              {kpiData.departmentDistribution.map((entry, index) => (
                <div key={entry.dept_name} className="flex items-center">
                  <span
                    className="w-3 h-3 rounded-full mr-2"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></span>
                  <span className="text-gray-600 truncate">
                    {entry.dept_name}: <b>{entry.value}</b>
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Advanced Performance Graph */}
          <div className="lg:col-span-2">
            <InteractiveDashboard
              data={performanceData}
              title="Real-Time Performance Analytics"
            />
          </div>
        </div>

        {/* System Health */}
        {/* <div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            System Infrastructure
          </h3>
          <SystemHealthMonitor />
        </div> */}
      </div>
    </div>
  );
};

export default AdminAnalyticsDashboard;
