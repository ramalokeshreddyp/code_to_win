import React, { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import LoadingSpinner from "./common/LoadingSpinner";
import { useAuth } from "./context/AuthContext";
import CheckYourScore from "./pages/CheckYourScore";
import Register from "./pages/Register";
import AOS from 'aos';
import 'aos/dist/aos.css';

// import StdDashboard from "./pages/dashboards/StdDashboard";

// Lazy-loaded components
const Login = lazy(() => import("./pages/Login"));
const StudentDashboard = lazy(() =>
  import("./pages/dashboards/StudentDashboard")
);
const FacultyDashboard = lazy(() =>
  import("./pages/dashboards/FacultyDashboard")
);
const HeadDashboard = lazy(() => import("./pages/dashboards/HeadDashboard"));
const AdminDashboard = lazy(() => import("./pages/dashboards/AdminDashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Dev = lazy(() => import("./pages/Dev"));
const ContactUs = lazy(() => import("./pages/Contact"));
const RankingTable = lazy(() => import("./components/Ranking"));
const Home = lazy(() => import("./pages/Home"));

const ProtectedRoute = ({ children, role }) => {
  const { currentUser, userRole } = useAuth();

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  if (role && role !== userRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const App = () => {
  useEffect(() => {
    AOS.init({
      duration: 800, // animation duration
      once: true,    // whether animation should happen only once
    });
  }, []);
  return (
    <>
      <Toaster position="top-right" />
      <BrowserRouter>
        <Suspense fallback={<LoadingSpinner fullPage />}>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dev" element={<Dev />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/rank" element={<RankingTable />} />
            <Route path="/checkscore" element={<CheckYourScore />} />

            {/* Protected routes - Student */}
            <Route
              path="/student/*"
              element={
                <ProtectedRoute role="student">
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />

            {/* Protected routes - Faculty */}
            <Route
              path="/faculty/*"
              element={
                <ProtectedRoute role="faculty">
                  <FacultyDashboard />
                </ProtectedRoute>
              }
            />

            {/* Protected routes - HOD */}
            <Route
              path="/hod/*"
              element={
                <ProtectedRoute role="hod">
                  <HeadDashboard />
                </ProtectedRoute>
              }
            />

            {/* Protected routes - Admin */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute role="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </>
  );
};

export default App;
