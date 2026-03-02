import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { useMeta } from '../../contexts/MetaContext';
import { apiFetch } from '../../utils';
import NotificationBell from '../../components/ui/NotificationBell';
import StatsCard from '../../components/ui/StatsCard';
import RankingScreen from '../RankingScreen';
import PlatformCard from 'src/components/ui/PlatformCard';

export default function HeadDashboard() {
  const insets = useSafeAreaInsets();
  const { currentUser, logout } = useAuth();
  const { years, sections } = useMeta();
  const [profile, setProfile] = useState(null);
  const [students, setStudents] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({ year: '', section: '' });
  const [selectedStudent, setSelectedStudent] = useState(null);

  const fetchProfile = useCallback(async () => {
    try {
      const data = await apiFetch(
        `/hod/profile?userId=${currentUser.hod_id || currentUser.user_id}`
      );
      setProfile(data);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    }
  }, [currentUser.hod_id, currentUser.user_id]);

  const fetchStudents = useCallback(async () => {
    if (!profile) return;
    try {
      const params = new URLSearchParams({
        dept: profile.dept_code,
        ...(filters.year && { year: filters.year }),
        ...(filters.section && { section: filters.section }),
      });
      const data = await apiFetch(`/hod/students?${params}`);
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch students:', err);
      setStudents([]);
    }
  }, [filters.section, filters.year, profile]);

  const fetchFaculty = useCallback(async () => {
    if (!profile) return;
    try {
      const data = await apiFetch(`/hod/faculty?dept=${profile.dept_code}`);
      setFaculty(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch faculty:', err);
      setFaculty([]);
    }
  }, [profile]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchProfile(), fetchStudents(), fetchFaculty()]);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (profile) {
      fetchStudents();
      fetchFaculty();
    }
  }, [profile, fetchStudents, fetchFaculty]);

  if (!profile) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Loading...</Text>
      </View>
    );
  }

  const renderOverview = () => (
    <>
      {/* Stats Cards */}
      <View className="mb-4 flex-row flex-wrap justify-between">
        <StatsCard
          icon="people-outline"
          color="blue"
          title="Students"
          value={profile.total_students}
        />
        <StatsCard
          icon="person-outline"
          color="green"
          title="Faculty"
          value={profile.total_faculty}
        />
        <StatsCard
          icon="layers-outline"
          color="purple"
          title="Sections"
          value={profile.total_sections}
        />
        <StatsCard
          icon="school-outline"
          color="orange"
          title="Department"
          value={profile.dept_name}
        />
      </View>

      {/* Department Info */}
      <View className="mb-4 rounded-lg bg-white p-4 shadow-sm">
        <Text className="mb-2 text-lg font-semibold">Department Overview</Text>
        <Text className="text-gray-600">Department: {profile.dept_name}</Text>
        <Text className="text-gray-600">HOD: {profile.name}</Text>
        <Text className="text-gray-600">Total Students: {profile.total_students}</Text>
        <Text className="text-gray-600">Total Faculty: {profile.total_faculty}</Text>
        <Text className="text-gray-600">Active Sections: {profile.total_sections}</Text>
      </View>

      <View className="rounded-lg bg-white p-4 shadow-sm">
        <Text className="mb-3 text-lg font-semibold">Faculty ({faculty.length})</Text>
        {faculty.length === 0 ? (
          <Text className="py-4 text-center text-gray-500">No faculty found</Text>
        ) : (
          faculty.map((member) => (
            <View
              key={member.faculty_id}
              className="flex-row items-center justify-between border-b border-gray-100 py-3">
              <View className="flex-1">
                <Text className="font-medium">{member.name}</Text>
                <Text className="text-sm text-gray-600">{member.faculty_id}</Text>
              </View>
              <View className="items-end">
                <Text className="text-sm text-gray-600">Year {member.year}</Text>
                <Text className="text-sm text-gray-600">Section {member.section}</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </>
  );

  const renderStudents = () => {
    return (
      <>
        {/* Filters */}
        <View className="mb-4 rounded-lg bg-white p-4 shadow-sm">
          <Text className="mb-3 font-semibold">Filters</Text>
          <View className="flex-row gap-3">
            <FilterSelect
              label="Year"
              value={filters.year}
              options={['', ...years]}
              onSelect={(value) => setFilters((prev) => ({ ...prev, year: value }))}
            />
            <FilterSelect
              label="Section"
              value={filters.section}
              options={['', ...sections]}
              onSelect={(value) => setFilters((prev) => ({ ...prev, section: value }))}
            />
          </View>
        </View>

        {/* Students List */}
        <View className="rounded-lg bg-white p-4 shadow-sm">
          <Text className="mb-3 text-lg font-semibold">Students ({students.length})</Text>
          {students.length === 0 ? (
            <Text className="py-4 text-center text-gray-500">No students found</Text>
          ) : (
            students.map((student, index) => (
              <TouchableOpacity
                key={student.student_id}
                className="flex-row items-center justify-between border-b border-gray-100 py-3"
                onPress={() => setSelectedStudent(student)}>
                <View className="flex-1">
                  <Text className="font-medium">{student.name}</Text>
                  <Text className="text-sm text-gray-600">{student.student_id}</Text>
                  <Text className="text-xs text-gray-500">
                    Year {student.year}, Section {student.section}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-sm font-medium">Score: {student.score || 0}</Text>
                  <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {selectedStudent && (
          <StudentDetailModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />
        )}
      </>
    );
  };

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <View>
          <Text className="text-lg font-bold">{currentUser.name}</Text>
          <Text className="text-sm text-gray-600">HOD Dashboard</Text>
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
            { key: 'overview', label: 'Overview', icon: 'analytics-outline' },
            { key: 'students', label: 'Students', icon: 'people-outline' },
            { key: 'faculty', label: 'Faculty', icon: 'person-outline' },
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
        {selectedTab === 'overview' && renderOverview()}
        {selectedTab === 'students' && renderStudents()}
        {selectedTab === 'rankings' && <RankingScreen tab={true} />}
      </ScrollView>
    </View>
  );
}

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

const FilterSelect = ({ label, value, options, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <TouchableOpacity
        className="flex-1 rounded border border-gray-300 px-3 py-2"
        onPress={() => setIsOpen(true)}>
        <Text className={`text-sm ${value ? 'text-gray-900' : 'text-gray-500'}`}>
          {value || label}
        </Text>
      </TouchableOpacity>

      <Modal visible={isOpen} transparent animationType="fade">
        <TouchableOpacity
          className="flex-1 items-center justify-center bg-black/50"
          onPress={() => setIsOpen(false)}>
          <View className="w-48 rounded-lg bg-white p-4">
            <Text className="mb-3 text-center font-semibold">{label}</Text>
            {options.map((option) => (
              <TouchableOpacity
                key={option}
                className="rounded px-3 py-2"
                onPress={() => {
                  onSelect(option);
                  setIsOpen(false);
                }}>
                <Text
                  className={`text-center ${value === option ? 'font-bold text-blue-600' : 'text-gray-700'}`}>
                  {option || 'All'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};
