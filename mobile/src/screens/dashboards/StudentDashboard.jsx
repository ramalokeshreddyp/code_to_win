import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import PlatformCard from '../../components/ui/PlatformCard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiFetch } from 'src/utils';
import NotificationBell from '../../components/ui/NotificationBell';
import StatsCard from '../../components/ui/StatsCard';
export default function StudentDashboard({ navigation }) {
  const insets = useSafeAreaInsets();
  const { currentUser, checkAuth, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  // Calculate stats only from accepted platforms
  const totalContests =
    currentUser.performance.platformWise.leetcode.contests +
    currentUser.performance.platformWise.codechef.contests;

  const totalBadges =
    currentUser.performance.platformWise.leetcode.badges +
    currentUser.performance.platformWise.codechef.badges;

  const totalStars =
    currentUser.performance.platformWise.hackerrank.badges +
    currentUser.performance.platformWise.codechef.stars;

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await apiFetch('/student/refresh-coding-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.student_id }),
      });
      await checkAuth();
    } catch (e) {
      console.error(e.message);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-gray-200 bg-white px-4 py-3 ">
        <View>
          <Text className="text-lg font-bold ">{currentUser.name}</Text>
          <Text className="text-sm text-gray-600 ">Student Dashboard</Text>
        </View>
        <View className="flex-row items-center gap-3">
          <NotificationBell />
          <TouchableOpacity onPress={logout}>
            <Ionicons name="log-out" size={24} color={'#374151'} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 p-5">
        {/* Avatar & Name */}
        <View className="mb-6 flex items-center justify-center">
          <View className="mb-2 h-32 w-32 items-center justify-center rounded-full bg-blue-100 ">
            <Text className="text-5xl font-bold text-blue-800 ">
              {currentUser.name
                ?.split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)}
            </Text>
          </View>
          <Text className="text-xl font-bold">{currentUser.name}</Text>
          <Text className="text-sm text-gray-600 ">
            University Rank: {currentUser.overall_rank}
          </Text>
        </View>

        {/* Profile Info Badges */}
        <View className="mb-4 flex-row flex-wrap justify-between gap-2">
          {[
            { label: 'Campus', value: currentUser.college },
            { label: 'Degree', value: currentUser.degree },
            { label: 'Dept', value: currentUser.dept_name },
            { label: 'Year', value: currentUser.year },
            { label: 'Section', value: currentUser.section },
          ].map((info) => (
            <Text
              key={info.label}
              className="rounded-full bg-white px-3 py-2 text-sm text-gray-800 shadow">
              {info.label}: <Text className="font-semibold">{info.value}</Text>
            </Text>
          ))}
        </View>

        {/* Refresh Button */}
        <TouchableOpacity
          onPress={handleRefresh}
          className="mb-4 flex-row items-center justify-center gap-2 rounded-xl bg-white p-3 shadow "
          disabled={refreshing}>
          <Ionicons
            name="refresh"
            size={20}
            color={'black'}
            className={` ${refreshing && 'animate-spin '}`}
          />
          <Text className="font-semibold ">{refreshing ? 'Refreshing...' : 'Refresh'}</Text>
        </TouchableOpacity>

        {/* Stats Cards */}
        <View className="mb-4 flex flex-row flex-wrap justify-between gap-3">
          <StatsCard
            icon="code"
            color="blue"
            title="Problems"
            value={currentUser?.performance?.combined?.totalSolved || 0}
          />
          <StatsCard icon="timer-outline" title="Contests" value={totalContests} color="success" />
          <StatsCard icon="star" title="Stars" value={totalStars} color="warning" />
          <StatsCard icon="bookmark" title="Badges" value={totalBadges} color="error" />
        </View>

        {/* Suspended Platforms Notification */}
        {['leetcode', 'codechef', 'geeksforgeeks', 'hackerrank'].filter(
          (platform) => currentUser.coding_profiles?.[`${platform}_status`] === 'suspended'
        ).length > 0 && (
          <View className="mb-4 rounded-lg border-l-4 border-yellow-400 bg-yellow-50 p-4">
            <Text className="mb-1 text-sm font-medium text-yellow-800">Platform Update Issues</Text>
            <Text className="text-sm text-yellow-700">
              Some platforms temporarily suspended due to connection issues. We&apos;ll retry
              automatically.
            </Text>
          </View>
        )}

        {/* Platform Performance Cards - Only show accepted platforms */}
        <View className="mb-12 flex gap-2">
          {currentUser.coding_profiles?.leetcode_status === 'accepted' && (
            <PlatformCard
              name="LeetCode"
              className={'text-yellow-500'}
              logo={require('../../../assets/leetcode.png')}
              total={
                currentUser.performance.platformWise.leetcode.easy +
                currentUser.performance.platformWise.leetcode.medium +
                currentUser.performance.platformWise.leetcode.hard
              }
              breakdown={{
                Easy: currentUser.performance.platformWise.leetcode.easy,
                Medium: currentUser.performance.platformWise.leetcode.medium,
                Hard: currentUser.performance.platformWise.leetcode.hard,
                Contests: currentUser.performance.platformWise.leetcode.contests,
                Badges: currentUser.performance.platformWise.leetcode.badges,
              }}
            />
          )}
          {currentUser.coding_profiles?.codechef_status === 'accepted' && (
            <PlatformCard
              name="CodeChef"
              className={'text-orange-950'}
              logo={require('../../../assets/codechef.png')}
              total={currentUser.performance.platformWise.codechef.contests}
              subtitle="Contests Participated"
              breakdown={{
                Solved: currentUser.performance.platformWise.codechef.problems,
                Stars: currentUser.performance.platformWise.codechef.stars,
                Badges: currentUser.performance.platformWise.codechef.badges,
              }}
            />
          )}
          {currentUser.coding_profiles?.geeksforgeeks_status === 'accepted' && (
            <PlatformCard
              name="GeeksforGeeks"
              className={'text-green-700'}
              logo={require('../../../assets/gfg.png')}
              total={
                currentUser.performance.platformWise.gfg.school +
                currentUser.performance.platformWise.gfg.basic +
                currentUser.performance.platformWise.gfg.easy +
                currentUser.performance.platformWise.gfg.medium +
                currentUser.performance.platformWise.gfg.hard
              }
              breakdown={{
                School: currentUser.performance.platformWise.gfg.school,
                Basic: currentUser.performance.platformWise.gfg.basic,
                Easy: currentUser.performance.platformWise.gfg.easy,
                Medium: currentUser.performance.platformWise.gfg.medium,
                Hard: currentUser.performance.platformWise.gfg.hard,
              }}
            />
          )}
          {currentUser.coding_profiles?.hackerrank_status === 'accepted' && (
            <PlatformCard
              name="HackerRank"
              className={''}
              logo={require('../../../assets/hackerrank.png')}
              total={currentUser.performance.platformWise.hackerrank.badges}
              subtitle="Badges Gained"
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}
