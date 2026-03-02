import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { useMeta } from '../contexts/MetaContext';
import { apiFetch } from '../utils';
import NotificationBell from '../components/ui/NotificationBell';
import PlatformCard from 'src/components/ui/PlatformCard';
import StatsCard from 'src/components/ui/StatsCard';

export default function RankingScreen({ navigation, tab = false }) {
  const insets = useSafeAreaInsets();
  const { currentUser, logout } = useAuth();
  const { depts, years, sections } = useMeta();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({ dept: '', year: '', section: '', search: '' });
  const [allRankings, setAllRankings] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const fetchRankings = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.dept) params.append('dept', filters.dept);
      if (filters.year) params.append('year', filters.year);
      if (filters.section) params.append('section', filters.section);
      params.append('limit', '100');

      const endpoint =
        filters.dept || filters.year || filters.section
          ? `/ranking/filter?${params}`
          : '/ranking/overall?limit=100';

      const data = await apiFetch(endpoint);
      const rankingArray = Array.isArray(data) ? data : [];
      setAllRankings(rankingArray);
    } catch (err) {
      console.error('Failed to fetch rankings:', err);
      setAllRankings([]);
    } finally {
      setLoading(false);
    }
  }, [filters.dept, filters.year, filters.section]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRankings();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchRankings();
  }, [fetchRankings]);

  // Filter rankings locally by search
  const filteredRankings = allRankings.filter((student) => {
    if (!filters.search) return true;
    const searchLower = filters.search.toLowerCase();
    return (
      student.name.toLowerCase().includes(searchLower) ||
      student.student_id.toLowerCase().includes(searchLower)
    );
  });

  const getRankColor = (rank) => {
    if (rank === 1) return '#FFD700'; // Gold
    if (rank === 2) return '#C0C0C0'; // Silver
    if (rank === 3) return '#CD7F32'; // Bronze
    return '#6B7280'; // Gray
  };

  return (
    <View className="flex-1 bg-gray-50" style={!tab ? { paddingTop: insets.top } : undefined}>
      {!tab && (
        <>
          {/* Header */}
          <View className="flex-row items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
            <View>
              <Text className="text-lg font-bold">{currentUser.name}</Text>
              <Text className="text-sm text-gray-600">Rankings</Text>
            </View>
            <View className="flex-row items-center gap-3">
              <NotificationBell />
              <TouchableOpacity onPress={logout}>
                <Ionicons name="log-out" size={24} color={'#374151'} />
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      {/* Filters */}
      <View className="border-b border-gray-200 bg-white p-4">
        <View className="mb-3 flex-row gap-2">
          <FilterSelect
            label="Department"
            value={filters.dept}
            options={['', ...depts.map((d) => d.dept_code)]}
            displayOptions={['All', ...depts.map((d) => d.dept_name)]}
            onSelect={(value) => setFilters((prev) => ({ ...prev, dept: value }))}
          />
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
        <TextInput
          className="rounded border border-gray-300 px-3 py-2 text-sm"
          placeholder="Search by name or roll number..."
          value={filters.search}
          onChangeText={(text) => setFilters((prev) => ({ ...prev, search: text }))}
        />
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {loading ? (
          <View className="flex-1 items-center justify-center p-8">
            <Text className="text-gray-500">Loading rankings...</Text>
          </View>
        ) : filteredRankings.length === 0 ? (
          <View className="flex-1 items-center justify-center p-8">
            <Ionicons name="trophy" size={48} color="#9CA3AF" />
            <Text className="mt-4 text-gray-500">No rankings found</Text>
          </View>
        ) : (
          <View className="p-4">
            {(Array.isArray(filteredRankings) &&
              filteredRankings.map((student, index) => (
                <TouchableOpacity
                  key={student.student_id}
                  className={`mb-3 rounded-lg bg-white p-4 shadow-sm ${
                    student.student_id === currentUser?.student_id ? 'border-2 border-blue-500' : ''
                  }`}
                  onPress={() => setSelectedStudent(student)}>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 flex-row items-center">
                      <View
                        className="mr-3 h-10 w-10 items-center justify-center rounded-full"
                        style={{ backgroundColor: getRankColor(student.rank || index + 1) }}>
                        <Text className="text-xs font-bold text-white">
                          #{student.rank || index + 1}
                        </Text>
                      </View>
                      <View className="flex-1">
                        <Text className="font-semibold text-gray-800">{student.name}</Text>
                        <Text className="text-sm text-gray-600">
                          {student.student_id} • {student.dept_name}
                        </Text>
                        <Text className="text-xs text-gray-500">
                          Year {student.year}, Section {student.section}
                        </Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className="text-lg font-bold text-blue-600">{student.score}</Text>
                      <Text className="text-xs text-gray-500">Score</Text>
                      {student.performance && (
                        <Text className="mt-1 text-xs text-gray-500">
                          {student.performance.combined.totalSolved} solved
                        </Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))) ||
              []}
          </View>
        )}
      </ScrollView>

      {/* Student Detail Modal */}
      {selectedStudent && (
        <StudentDetailModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />
      )}
    </View>
  );
}

const FilterSelect = ({ label, value, options, displayOptions, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const displayLabels = displayOptions || options;

  return (
    <>
      <TouchableOpacity
        className="flex-1 rounded border border-gray-300 px-3 py-2"
        onPress={() => setIsOpen(true)}>
        <Text className={`text-sm ${value ? 'text-gray-900' : 'text-gray-500'}`}>
          {value ? displayLabels[options.indexOf(value)] || value : label}
        </Text>
      </TouchableOpacity>

      <Modal visible={isOpen} transparent animationType="fade">
        <TouchableOpacity
          className="flex-1 items-center justify-center bg-black/50"
          onPress={() => setIsOpen(false)}>
          <View className="w-48 rounded-lg bg-white p-4">
            <Text className="mb-3 text-center font-semibold">{label}</Text>
            {options.map((option, index) => (
              <TouchableOpacity
                key={option}
                className="rounded px-3 py-2"
                onPress={() => {
                  onSelect(option);
                  setIsOpen(false);
                }}>
                <Text
                  className={`text-center ${value === option ? 'font-bold text-blue-600' : 'text-gray-700'}`}>
                  {displayLabels[index] || option || 'All'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
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
            <PlatformCard
              name="LeetCode"
              className={'text-yellow-500'}
              logo={require('../../assets/leetcode.png')}
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

            <PlatformCard
              name="CodeChef"
              className={'text-orange-950'}
              logo={require('../../assets/codechef.png')}
              total={student.performance.platformWise.codechef.contests}
              subtitle="Contests Participated"
              breakdown={{
                Solved: student.performance.platformWise.codechef.problems,
                Stars: student.performance.platformWise.codechef.stars,
                Badges: student.performance.platformWise.codechef.badges,
              }}
            />

            <PlatformCard
              name="GeeksforGeeks"
              className={'text-green-700'}
              logo={require('../../assets/gfg.png')}
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

            <PlatformCard
              name="HackerRank"
              className={''}
              logo={require('../../assets/hackerrank.png')}
              total={student.performance.platformWise.hackerrank.badges}
              subtitle="Badges Gained"
            />
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};
