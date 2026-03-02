import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminDashboard({ navigation }) {
  const { currentUser, logout } = useAuth();
  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <Text className="mb-6 text-3xl font-bold">Welcome to the Admin Screen</Text>
      <Text className="mb-6 text-xl">Hello, {currentUser?.name || 'User'}!</Text>
      <TouchableOpacity className="rounded bg-blue-600 px-5 py-3" onPress={logout}>
        <Text className="text-center font-medium text-white">Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}
