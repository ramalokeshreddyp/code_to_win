import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  lazy,
  Suspense,
} from "react";
import { useAuth } from "../../context/AuthContext";
import Navbar from "../../components/Navbar";
import axios from "axios";
import LoadingSpinner from "../../common/LoadingSpinner";
import {
  AddIndividualStudentModel,
  DeleteIndividualStudentModal,
  ResetPasswordModal,
} from "../../components/Modals";
import UserProfile from "../../components/ui/UserProfile";
import Footer from "../../components/Footer";
import DashboardSidebar from "../../components/DashboardSidebar";
import {
  FiMenu,
  FiBarChart2,
  FiUsers,
  FiUserCheck,
  FiUserPlus,
} from "react-icons/fi";

// Lazy-loaded components
const RankingTable = lazy(() => import("../../components/Ranking"));
const ViewProfile = lazy(() => import("../../components/ViewProfile"));
const CodingProfileRequests = lazy(() =>
  import("../../components/ui/CodingProfileRequests")
);
const StudentTable = lazy(() => import("../../components/ui/StudentTable"));
const BulkImportWithCP = lazy(() =>
  import("../../components/ui/BulkImportWithCP")
);

function FacultyDashboard() {
  const { currentUser, logout } = useAuth();
  const [addStudentMenu, setAddStudentMenu] = useState("individual");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState("StudentRanking");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { key: "StudentRanking", label: "Student Ranking", icon: <FiBarChart2 /> },
    { key: "StudentManagment", label: "Student Management", icon: <FiUsers /> },
    {
      key: "StudentRequests",
      label: "Student Requests",
      icon: <FiUserCheck />,
    },
    { key: "AddStudent", label: "Add Student", icon: <FiUserPlus /> },
  ];

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/faculty/students`, {
        params: {
          dept: currentUser?.dept_code,
          year: currentUser?.year,
          section: currentUser?.section,
        },
      });
      setStudents(data);
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.dept_code, currentUser?.year, currentUser?.section]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const memoizedStudents = useMemo(() => students, [students]);

  return (
    <>
      {selectedStudent && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-50 flex items-center justify-center h-screen bg-black/30">
              <LoadingSpinner />
            </div>
          }
        >
          <ViewProfile
            student={selectedStudent}
            onClose={() => setSelectedStudent(null)}
          />
        </Suspense>
      )}

      <Navbar toggleSidebar={() => setSidebarOpen(true)} />
      <div className="flex bg-gray-50 min-h-screen">
        <DashboardSidebar
          isOpen={sidebarOpen}
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          selectedTab={selectedTab}
          setSelectedTab={setSelectedTab}
          menuItems={menuItems}
          title="Faculty Dashboard"
          onLogout={logout}
        />

        <div className="flex-1 lg:ml-64">
          <div className="p-4 md:p-6 space-y-4">
            <UserProfile user={currentUser} />

            {loading ? (
              <LoadingSpinner />
            ) : (
              <>
                {selectedTab === "StudentRanking" && (
                  <Suspense fallback={<LoadingSpinner />}>
                    <RankingTable filter={true} />
                  </Suspense>
                )}

                {selectedTab === "StudentManagment" && (
                  <div className="bg-white p-1 md:p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">
                      Student Management
                    </h2>
                    <p className="text-gray-500 mb-4">
                      Manage student records, update details, and more.
                    </p>
                    <Suspense
                      fallback={
                        <>
                          <LoadingSpinner />
                          <p className="text-center">
                            Loading Student Table...
                          </p>
                        </>
                      }
                    >
                      <div className="overflow-x-scroll md:overflow-hidden">
                        <StudentTable
                          students={memoizedStudents}
                          showBranch={true}
                          showYear={false}
                          showSection={true}
                          onProfileClick={setSelectedStudent}
                        />
                      </div>
                    </Suspense>
                  </div>
                )}

                {selectedTab === "StudentRequests" && (
                  <div className="bg-white p-2 md:p-6 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">
                      Student Requests
                    </h2>
                    <p className="text-gray-500 mb-4">
                      Review and manage student coding profile requests.
                    </p>
                    <Suspense
                      fallback={
                        <>
                          <LoadingSpinner />
                          <p className="text-center">
                            Loading Student Requests...
                          </p>
                        </>
                      }
                    >
                      <CodingProfileRequests
                        dept={currentUser?.dept_code}
                        year={currentUser?.year}
                        section={currentUser?.section}
                        facultyId={currentUser?.faculty_id}
                      />
                    </Suspense>
                  </div>
                )}

                {selectedTab === "AddStudent" && (
                  <div className="flex flex-col lg:flex-row gap-6 p-0 md:p-6 bg-gray-50">
                    {/* Sidebar Menu */}
                    <div className="w-full lg:w-1/4 bg-white p-4 md:p-6 rounded shadow mb-4 lg:mb-0">
                      <h2 className="text-lg font-bold text-gray-900 mb-4">
                        More
                      </h2>
                      <ul className="space-y-2">
                        <li>
                          <button
                            className={`w-full text-left px-3 py-2 rounded ${
                              addStudentMenu === "individual"
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-900"
                            }`}
                            onClick={() => setAddStudentMenu("individual")}
                          >
                            Add Individual Student
                          </button>
                        </li>
                        <li>
                          <button
                            className={`w-full text-left px-3 py-2 rounded ${
                              addStudentMenu === "bulk"
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-900"
                            }`}
                            onClick={() => setAddStudentMenu("bulk")}
                          >
                            Bulk Import Students
                          </button>
                        </li>
                        <li>
                          <button
                            className={`w-full text-left px-3 py-2 rounded ${
                              addStudentMenu === "delete"
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-900"
                            }`}
                            onClick={() => setAddStudentMenu("delete")}
                          >
                            Delete Student
                          </button>
                        </li>
                        <li>
                          <button
                            className={`w-full text-left px-3 py-2 rounded ${
                              addStudentMenu === "resetpassword"
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-900"
                            }`}
                            onClick={() => setAddStudentMenu("resetpassword")}
                          >
                            Reset Password
                          </button>
                        </li>
                      </ul>
                    </div>

                    {/* Dynamic Content Area */}
                    <div className="w-full lg:w-3/4">
                      {addStudentMenu === "individual" && (
                        <Suspense fallback={<LoadingSpinner />}>
                          <AddIndividualStudentModel
                            onSuccess={fetchStudents}
                          />
                        </Suspense>
                      )}
                      {addStudentMenu === "bulk" && (
                        <div className="bg-white p-4 md:p-6 h-fit rounded shadow">
                          <h2 className="text-xl font-bold text-gray-900 mb-1">
                            Bulk Import Students
                          </h2>
                          <p className="text-sm text-gray-500 mb-6">
                            Import multiple students from CSV file
                          </p>
                          <Suspense fallback={<LoadingSpinner />}>
                            <BulkImportWithCP onSuccess={fetchStudents} />
                          </Suspense>
                        </div>
                      )}
                      {addStudentMenu === "delete" && (
                        <Suspense fallback={<LoadingSpinner />}>
                          <DeleteIndividualStudentModal
                            onSuccess={fetchStudents}
                          />
                        </Suspense>
                      )}
                      {addStudentMenu === "resetpassword" && (
                        <div className="bg-white p-4 md:p-6 h-fit rounded shadow">
                          <h2 className="text-xl font-bold text-gray-900 mb-1">
                            Reset Student Password
                          </h2>
                          <p className="text-sm text-gray-500 mb-6">
                            Reset the password for a student
                          </p>
                          <Suspense fallback={<LoadingSpinner />}>
                            <ResetPasswordModal onSuccess={fetchStudents} />
                          </Suspense>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default FacultyDashboard;
