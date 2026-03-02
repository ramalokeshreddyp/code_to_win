import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { apiFetch } from '../../utils';
import NotificationBell from '../../components/ui/NotificationBell';
import StatsCard from '../../components/ui/StatsCard';
import RankingScreen from '../RankingScreen';
import PlatformCard from 'src/components/ui/PlatformCard';

export default function FacultyDashboard() {
  const insets = useSafeAreaInsets();
  const { currentUser, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [students, setStudents] = useState([]);
  const [requests, setRequests] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('dashboard');

  const fetchProfile = useCallback(async () => {
    try {
      const data = await apiFetch(`/faculty/profile?userId=${currentUser.faculty_id}`);
      setProfile(data);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    }
  }, [currentUser.faculty_id]);

  const fetchStudents = useCallback(async () => {
    if (!profile) return;
    try {
      const data = await apiFetch(
        `/faculty/students?dept=${profile.dept_code}&year=${profile.year}&section=${profile.section}`
      );
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch students:', err);
      setStudents([]);
    }
  }, [profile]);

  const fetchRequests = useCallback(async () => {
    if (!profile) return;
    try {
      const data = await apiFetch(
        `/faculty/coding-profile-requests?dept=${profile.dept_code}&year=${profile.year}&section=${profile.section}`
      );
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch requests:', err);
      setRequests([]);
    }
  }, [profile]);

  const handleVerification = async (studentId, platform, action) => {
    try {
      await apiFetch('/faculty/verify-coding-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: studentId,
          platform,
          action,
          faculty_id: currentUser.faculty_id,
        }),
      });

      Alert.alert('Success', `Profile ${action}ed successfully`);

      // Update the current student's request status locally
      const updatedReqs = selectedStudent.reqs.map((req) => ({
        ...req,
        [`${platform}_status`]: action === 'accept' ? 'accepted' : 'rejected',
      }));

      // Check if there are any remaining pending/suspended requests for this student
      const hasRemainingRequests = ['leetcode', 'codechef', 'geeksforgeeks', 'hackerrank'].some(
        (p) => {
          const status = updatedReqs[0][`${p}_status`];
          const username = updatedReqs[0][`${p}_id`];
          return username && (status === 'pending' || status === 'suspended');
        }
      );

      if (!hasRemainingRequests) {
        setSelectedStudent(null);
      } else {
        setSelectedStudent({ ...selectedStudent, reqs: updatedReqs });
      }

      // Refresh the main requests list
      await fetchRequests();
    } catch (_err) {
      Alert.alert('Error', 'Failed to verify profile');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchProfile(), fetchStudents(), fetchRequests()]);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (profile) {
      fetchStudents();
      fetchRequests();
    }
  }, [profile, fetchStudents, fetchRequests]);

  const groupedRequests = Array.isArray(requests)
    ? requests.reduce((acc, req) => {
        if (!acc[req.student_id]) acc[req.student_id] = [];
        acc[req.student_id].push(req);
        return acc;
      }, {})
    : {};

  if (!profile) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <View>
          <Text className="text-lg font-bold">{currentUser.name}</Text>
          <Text className="text-sm text-gray-600">Faculty Dashboard</Text>
        </View>
        <View className="flex-row items-center gap-3">
          <NotificationBell />
          <TouchableOpacity onPress={logout}>
            <Ionicons name="log-out" size={24} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Navigation */}
      <View className="border-b border-gray-200 bg-white">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4">
          {[
            { key: 'dashboard', label: 'Dashboard', icon: 'home-outline' },
            { key: 'students', label: 'Students', icon: 'people-outline' },
            { key: 'rankings', label: 'Rankings', icon: 'trophy-outline' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              className={`mr-2 flex-row items-center px-4 py-3 ${selectedTab === tab.key ? 'border-b-2 border-blue-500' : ''}`}
              onPress={() => setSelectedTab(tab.key)}>
              <Ionicons
                name={tab.icon}
                size={16}
                color={selectedTab === tab.key ? '#3B82F6' : '#6B7280'}
              />
              <Text
                className={`ml-2 ${selectedTab === tab.key ? 'font-medium text-blue-600' : 'text-gray-600'}`}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        className="flex-1 p-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {selectedTab === 'dashboard' && (
          <>
            {/* Profile Info */}
            <View className="mb-4 rounded-lg bg-white p-4 shadow-sm">
              <Text className="mb-2 text-lg font-semibold">Profile Information</Text>
              <Text className="text-gray-600">Department: {profile.dept_name}</Text>
              <Text className="text-gray-600">
                Assigned: Year {profile.year}, Section {profile.section}
              </Text>
              <Text className="text-gray-600">Total Students: {profile.total_students}</Text>
            </View>

            {/* Stats */}
            <View className="mb-4 flex-row justify-between">
              <StatsCard
                icon="people-outline"
                color="blue"
                title="Students"
                value={students.length}
              />
              <StatsCard
                icon="time-outline"
                color="warning"
                title="Pending"
                value={Object.keys(groupedRequests).length}
              />
            </View>

            {/* Pending Requests */}
            <View className="mb-4 rounded-lg bg-white p-4 shadow-sm">
              <Text className="mb-3 text-lg font-semibold">Pending Profile Requests</Text>
              {Object.keys(groupedRequests).length === 0 ? (
                <Text className="py-4 text-center text-gray-500">No pending requests</Text>
              ) : (
                Object.entries(groupedRequests).map(([studentId, reqs]) => (
                  <TouchableOpacity
                    key={studentId}
                    className="flex-row items-center justify-between border-b border-gray-100 py-3"
                    onPress={() => setSelectedStudent({ student_id: studentId, reqs })}>
                    <View>
                      <Text className="font-medium">{reqs[0].name}</Text>
                      <Text className="text-sm text-gray-600">{studentId}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                ))
              )}
            </View>
          </>
        )}
        {selectedTab === 'students' && <StudentsTab students={students} />}
        {selectedTab === 'rankings' && <RankingTab />}
      </ScrollView>

      {/* Request Modal */}
      {selectedStudent && (
        <Modal
          visible={true}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setSelectedStudent(null)}>
          <View className="flex-1 bg-white">
            <View className="flex-row items-center justify-between border-b border-gray-200 p-4">
              <Text className="text-lg font-semibold">
                {selectedStudent.reqs[0].name} ({selectedStudent.student_id})
              </Text>
              <TouchableOpacity onPress={() => setSelectedStudent(null)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 p-4">
              {['leetcode', 'codechef', 'geeksforgeeks', 'hackerrank'].map((platform) => {
                const idKey = `${platform}_id`;
                const statusKey = `${platform}_status`;
                const username = selectedStudent.reqs[0][idKey];
                const status = selectedStudent.reqs[0][statusKey];

                // Show if username exists and status is pending or suspended
                if (!username || !status || (status !== 'pending' && status !== 'suspended')) {
                  return null;
                }

                return (
                  <View
                    key={platform}
                    className={`mb-3 rounded-lg border p-4 ${status === 'suspended' ? 'border-yellow-200 bg-yellow-50' : 'border-gray-200 bg-gray-50'}`}>
                    <View className="mb-2 flex-row items-center justify-between">
                      <Text className="font-medium capitalize">{platform}</Text>
                      {status === 'suspended' && (
                        <View className="rounded bg-yellow-100 px-2 py-1">
                          <Text className="text-xs text-yellow-800">Suspended</Text>
                        </View>
                      )}
                    </View>
                    <Text className="mb-3 text-gray-600">Username: {username}</Text>

                    <View className="flex-row gap-2">
                      {status === 'suspended' ? (
                        <TouchableOpacity
                          className="flex-1 rounded bg-blue-500 py-2"
                          onPress={() =>
                            handleVerification(selectedStudent.student_id, platform, 'accept')
                          }>
                          <Text className="text-center font-medium text-white">Reactivate</Text>
                        </TouchableOpacity>
                      ) : (
                        <>
                          <TouchableOpacity
                            className="flex-1 rounded bg-green-500 py-2"
                            onPress={() =>
                              handleVerification(selectedStudent.student_id, platform, 'accept')
                            }>
                            <Text className="text-center font-medium text-white">Accept</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            className="flex-1 rounded bg-red-500 py-2"
                            onPress={() =>
                              handleVerification(selectedStudent.student_id, platform, 'reject')
                            }>
                            <Text className="text-center font-medium text-white">Reject</Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </Modal>
      )}
    </View>
  );
}
const StudentsTab = ({ students }) => {
  const [selectedStudent, setSelectedStudent] = useState(null);

  return (
    <View className="flex-1">
      <Text className="mb-4 text-lg font-semibold">Students ({students.length})</Text>

      <ScrollView className="flex-1">
        {students.length === 0 ? (
          <Text className="py-8 text-center text-gray-500">No students found</Text>
        ) : (
          students.map((student) => (
            <TouchableOpacity
              key={student.student_id}
              className="mb-3 rounded-lg bg-white p-4 shadow-sm"
              onPress={() => setSelectedStudent(student)}>
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="font-semibold text-gray-800">{student.name}</Text>
                  <Text className="text-sm text-gray-600">{student.student_id}</Text>
                  <Text className="text-xs text-gray-500">Score: {student.score || 0}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {selectedStudent && (
        <StudentDetailModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />
      )}
    </View>
  );
};

const StudentDetailModal = ({ student, onClose }) => {
  const totalBadges =
    (student?.performance?.platformWise?.leetcode?.badges || 0) +
    (student?.performance?.platformWise?.codechef?.badges || 0);

  const totalStars =
    (student?.performance?.platformWise?.hackerrank?.badges || 0) +
    (student?.performance?.platformWise?.codechef?.stars || 0);
  return (
    <Modal
      visible={true}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}>
      <View className="flex-1 bg-gray-100">
        {/* Header */}
        <View className="flex-row items-center justify-between border-b border-gray-200 bg-white p-4">
          <Text className="text-lg font-semibold">Student Profile</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#374151" />
          </TouchableOpacity>
        </View>
        <ScrollView className="flex-1 p-6">
          {/* Blue Header Card */}
          <View className="mb-4 rounded-xl bg-white p-4 shadow-lg">
            <View className="mb-4 flex-row items-center">
              <View className="flex h-16 w-16 items-center justify-center rounded-lg bg-blue-100 text-blue-800">
                <Text className="text-2xl font-bold text-blue-800">
                  {student.name
                    ?.split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)}
                </Text>
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-lg font-bold">{student.name}</Text>
                <Text className="text-sm text-gray-500">
                  University Rank: {student.overall_rank || 'N/A'}
                </Text>
                <Text className="text-sm text-gray-500">Score: {student.score || 0}</Text>
              </View>
            </View>

            <View className="flex flex-row justify-between px-6 py-2">
              {[
                { label: 'Campus', value: student?.college },
                { label: 'Section', value: student?.section },
                { label: 'Year', value: student?.year },
                { label: 'Department', value: student?.dept_name },
                { label: 'Degree', value: student?.degree },
              ].map((item, index) => (
                <View key={index}>
                  <Text className="text-xs text-black text-opacity-80">{item.label}:</Text>
                  <Text className="text-sm font-medium text-black">{item.value}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Stats Cards */}
          <View className="mb-4 flex flex-row flex-wrap justify-between gap-3">
            <StatsCard
              icon="code"
              color="blue"
              title="Problems"
              value={student?.performance?.combined?.totalSolved || 0}
            />
            <StatsCard
              icon="timer-outline"
              title="Contests"
              value={student?.performance?.combined?.totalContests || 0}
              color="success"
            />
            <StatsCard icon="star" title="Stars" value={totalStars} color="warning" />
            <StatsCard icon="bookmark" title="Badges" value={totalBadges} color="error" />
          </View>

          {/* Platform Cards */}
          <View className="mb-12 flex gap-2">
            {student.coding_profiles?.leetcode_status === 'accepted' && (
              <PlatformCard
                name="LeetCode"
                className={'text-yellow-500'}
                logo={require('../../../assets/leetcode.png')}
                total={
                  student.performance.platformWise.leetcode.easy +
                  student.performance.platformWise.leetcode.medium +
                  student.performance.platformWise.leetcode.hard
                }
                breakdown={{
                  Easy: student.performance.platformWise.leetcode.easy,
                  Medium: student.performance.platformWise.leetcode.medium,
                  Hard: student.performance.platformWise.leetcode.hard,
                  Contests: student.performance.platformWise.leetcode.contests,
                  Badges: student.performance.platformWise.leetcode.badges,
                }}
              />
            )}
            {student.coding_profiles?.codechef_status === 'accepted' && (
              <PlatformCard
                name="CodeChef"
                className={'text-orange-950'}
                logo={require('../../../assets/codechef.png')}
                total={student.performance.platformWise.codechef.contests}
                subtitle="Contests Participated"
                breakdown={{
                  Solved: student.performance.platformWise.codechef.problems,
                  Stars: student.performance.platformWise.codechef.stars,
                  Badges: student.performance.platformWise.codechef.badges,
                }}
              />
            )}
            {student.coding_profiles?.geeksforgeeks_status === 'accepted' && (
              <PlatformCard
                name="GeeksforGeeks"
                className={'text-green-700'}
                logo={require('../../../assets/gfg.png')}
                total={
                  student.performance.platformWise.gfg.school +
                  student.performance.platformWise.gfg.basic +
                  student.performance.platformWise.gfg.easy +
                  student.performance.platformWise.gfg.medium +
                  student.performance.platformWise.gfg.hard
                }
                breakdown={{
                  School: student.performance.platformWise.gfg.school,
                  Basic: student.performance.platformWise.gfg.basic,
                  Easy: student.performance.platformWise.gfg.easy,
                  Medium: student.performance.platformWise.gfg.medium,
                  Hard: student.performance.platformWise.gfg.hard,
                }}
              />
            )}
            {student.coding_profiles?.hackerrank_status === 'accepted' && (
              <PlatformCard
                name="HackerRank"
                className={''}
                logo={require('../../../assets/hackerrank.png')}
                total={student.performance.platformWise.hackerrank.badges}
                subtitle="Badges Gained"
              />
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const RankingTab = () => {
  return <RankingScreen tab={true} />;
};
