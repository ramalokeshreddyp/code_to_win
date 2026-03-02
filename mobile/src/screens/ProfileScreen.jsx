import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../contexts/AuthContext';
import { apiFetch } from '../utils';
import NotificationBell from '../components/ui/NotificationBell';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { currentUser, checkAuth, logout } = useAuth();
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [editingProfiles, setEditingProfiles] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [personalData, setPersonalData] = useState({
    name: currentUser?.name || '',
  });
  const [profileData, setProfileData] = useState({
    leetcode_id: currentUser?.coding_profiles?.leetcode_id || '',
    codechef_id: currentUser?.coding_profiles?.codechef_id || '',
    geeksforgeeks_id: currentUser?.coding_profiles?.geeksforgeeks_id || '',
    hackerrank_id: currentUser?.coding_profiles?.hackerrank_id || '',
  });

  const originalProfileData = {
    leetcode_id: currentUser?.coding_profiles?.leetcode_id || '',
    codechef_id: currentUser?.coding_profiles?.codechef_id || '',
    geeksforgeeks_id: currentUser?.coding_profiles?.geeksforgeeks_id || '',
    hackerrank_id: currentUser?.coding_profiles?.hackerrank_id || '',
  };
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSavePersonal = async () => {
    setLoading(true);
    try {
      await apiFetch('/student/update-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.student_id,
          name: personalData.name,
        }),
      });
      await checkAuth();
      setEditingPersonal(false);
      Alert.alert('Success', 'Personal details updated successfully');
    } catch (_err) {
      Alert.alert('Error', 'Failed to update personal details');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfiles = async () => {
    setLoading(true);
    try {
      // Only send changed fields
      const changedFields = { userId: currentUser.student_id };
      Object.keys(profileData).forEach((key) => {
        if (profileData[key] !== originalProfileData[key]) {
          changedFields[key] = profileData[key];
        }
      });

      if (Object.keys(changedFields).length === 1) {
        Alert.alert('Info', 'No changes to save');
        setLoading(false);
        return;
      }

      await apiFetch('/student/coding-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(changedFields),
      });
      await checkAuth();
      setEditingProfiles(false);
      Alert.alert('Success', 'Coding profiles updated successfully');
    } catch (_err) {
      Alert.alert('Error', 'Failed to update coding profiles');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPersonal = () => {
    setPersonalData({ name: currentUser?.name || '' });
    setEditingPersonal(false);
  };

  const handleCancelProfiles = () => {
    setProfileData({
      leetcode_id: currentUser?.coding_profiles?.leetcode_id || '',
      codechef_id: currentUser?.coding_profiles?.codechef_id || '',
      geeksforgeeks_id: currentUser?.coding_profiles?.geeksforgeeks_id || '',
      hackerrank_id: currentUser?.coding_profiles?.hackerrank_id || '',
    });
    setEditingProfiles(false);
  };

  const handleSavePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await apiFetch('/student/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.student_id,
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });
      setEditingPassword(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      Alert.alert('Success', 'Password changed successfully');
    } catch (_err) {
      Alert.alert('Error', 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPassword = () => {
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setEditingPassword(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'accepted':
        return <Ionicons name="checkmark-circle" size={20} color="#10B981" />;
      case 'rejected':
        return <Ionicons name="close-circle" size={20} color="#EF4444" />;
      case 'suspended':
        return <Ionicons name="pause-circle" size={20} color="#F59E0B" />;
      case 'pending':
        return <Ionicons name="time" size={20} color="#6B7280" />;
      default:
        return <Ionicons name="help-circle" size={20} color="#9CA3AF" />;
    }
  };

  return (
    <View className="flex-1 bg-gray-50" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <View>
          <Text className="text-lg font-bold">{currentUser.name}</Text>
          <Text className="text-sm text-gray-600">Profile Settings</Text>
        </View>
        <View className="flex-row items-center gap-3">
          <NotificationBell />
          <TouchableOpacity onPress={logout}>
            <Ionicons name="log-out" size={24} color={'#374151'} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 p-4">
        {/* Personal Information */}
        <View className="mb-4 rounded-lg bg-white p-4 shadow-sm">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-lg font-semibold">Personal Information</Text>
            {!editingPersonal ? (
              <TouchableOpacity onPress={() => setEditingPersonal(true)}>
                <Ionicons name="create-outline" size={20} color="#3B82F6" />
              </TouchableOpacity>
            ) : (
              <View className="flex-row gap-3">
                <TouchableOpacity onPress={handleCancelPersonal}>
                  <Ionicons name="close" size={20} color="#EF4444" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSavePersonal} disabled={loading}>
                  <Ionicons name="checkmark" size={20} color="#10B981" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View className="mb-3">
            <Text className="mb-1 text-sm text-gray-600">Name</Text>
            {editingPersonal ? (
              <TextInput
                className="rounded border border-gray-300 px-3 py-2"
                value={personalData.name}
                onChangeText={(text) => setPersonalData((prev) => ({ ...prev, name: text }))}
                placeholder="Enter your name"
              />
            ) : (
              <Text className="py-2 text-gray-800">{currentUser?.name}</Text>
            )}
          </View>

          <View className="space-y-2">
            <Text className="text-gray-600">Roll Number: {currentUser?.student_id}</Text>
            <Text className="text-gray-600">Email: {currentUser?.email}</Text>
            <Text className="text-gray-600">Department: {currentUser?.dept_name}</Text>
            <Text className="text-gray-600">Year: {currentUser?.year}</Text>
            <Text className="text-gray-600">Section: {currentUser?.section}</Text>
          </View>
        </View>

        {/* Change Password */}
        <View className="mb-4 rounded-lg bg-white p-4 shadow-sm">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-lg font-semibold">Change Password</Text>
            {!editingPassword ? (
              <TouchableOpacity onPress={() => setEditingPassword(true)}>
                <Ionicons name="create-outline" size={20} color="#3B82F6" />
              </TouchableOpacity>
            ) : (
              <View className="flex-row gap-3">
                <TouchableOpacity onPress={handleCancelPassword}>
                  <Ionicons name="close" size={20} color="#EF4444" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSavePassword} disabled={loading}>
                  <Ionicons name="checkmark" size={20} color="#10B981" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {editingPassword ? (
            <>
              <View className="mb-3">
                <Text className="mb-1 text-sm text-gray-600">Current Password</Text>
                <TextInput
                  className="rounded border border-gray-300 px-3 py-2"
                  value={passwordData.currentPassword}
                  onChangeText={(text) =>
                    setPasswordData((prev) => ({ ...prev, currentPassword: text }))
                  }
                  placeholder="Enter current password"
                  secureTextEntry
                />
              </View>
              <View className="mb-3">
                <Text className="mb-1 text-sm text-gray-600">New Password</Text>
                <TextInput
                  className="rounded border border-gray-300 px-3 py-2"
                  value={passwordData.newPassword}
                  onChangeText={(text) =>
                    setPasswordData((prev) => ({ ...prev, newPassword: text }))
                  }
                  placeholder="Enter new password"
                  secureTextEntry
                />
              </View>
              <View className="mb-3">
                <Text className="mb-1 text-sm text-gray-600">Confirm New Password</Text>
                <TextInput
                  className="rounded border border-gray-300 px-3 py-2"
                  value={passwordData.confirmPassword}
                  onChangeText={(text) =>
                    setPasswordData((prev) => ({ ...prev, confirmPassword: text }))
                  }
                  placeholder="Confirm new password"
                  secureTextEntry
                />
              </View>
            </>
          ) : (
            <Text className="py-2 text-gray-600">••••••••</Text>
          )}
        </View>

        {/* Coding Profiles */}
        <View className="rounded-lg bg-white p-4 shadow-sm">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-lg font-semibold">Coding Profiles</Text>
            {!editingProfiles ? (
              <TouchableOpacity onPress={() => setEditingProfiles(true)}>
                <Ionicons name="create-outline" size={20} color="#3B82F6" />
              </TouchableOpacity>
            ) : (
              <View className="flex-row gap-3">
                <TouchableOpacity onPress={handleCancelProfiles}>
                  <Ionicons name="close" size={20} color="#EF4444" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSaveProfiles} disabled={loading}>
                  <Ionicons name="checkmark" size={20} color="#10B981" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {[
            { key: 'leetcode', label: 'LeetCode', placeholder: 'Enter LeetCode username' },
            { key: 'codechef', label: 'CodeChef', placeholder: 'Enter CodeChef username' },
            { key: 'geeksforgeeks', label: 'GeeksforGeeks', placeholder: 'Enter GFG username' },
            { key: 'hackerrank', label: 'HackerRank', placeholder: 'Enter HackerRank username' },
          ].map((platform) => {
            const fieldKey = `${platform.key}_id`;
            const statusKey = `${platform.key}_status`;
            const status = currentUser?.coding_profiles?.[statusKey];

            return (
              <View key={platform.key} className="mb-4">
                <View className="mb-1 flex-row items-center justify-between">
                  <Text className="text-sm text-gray-600">{platform.label}</Text>
                  {getStatusIcon(status)}
                </View>
                {editingProfiles ? (
                  <TextInput
                    className="rounded border border-gray-300 px-3 py-2"
                    value={profileData[fieldKey]}
                    onChangeText={(text) =>
                      setProfileData((prev) => ({ ...prev, [fieldKey]: text }))
                    }
                    placeholder={platform.placeholder}
                  />
                ) : (
                  <Text className="py-2 text-gray-800">
                    {currentUser?.coding_profiles?.[fieldKey] || 'Not provided'}
                  </Text>
                )}
                {status && (
                  <Text
                    className={`mt-1 text-xs ${
                      status === 'accepted'
                        ? 'text-green-600'
                        : status === 'rejected'
                          ? 'text-red-600'
                          : status === 'suspended'
                            ? 'text-yellow-600'
                            : 'text-gray-500'
                    }`}>
                    Status: {status.charAt(0).toUpperCase() + status.slice(1)}
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
