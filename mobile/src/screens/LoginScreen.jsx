import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student'); // default role
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    const { success, message } = await login(userId, password, role);
    setLoading(false);
    if (!success) {
      Alert.alert('Login Failed', message);
    }
  };

  return (
    <View className="flex-1 items-center justify-center bg-white px-6 ">
      <Text className="mb-6 text-3xl font-bold ">Welcome Back</Text>

      <TextInput
        placeholder="User ID"
        value={userId}
        onChangeText={setUserId}
        className="mb-4 w-full rounded border border-gray-300 px-4 py-2 "
        editable={!loading}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        className="mb-4 w-full rounded border border-gray-300 px-4 py-2"
        editable={!loading}
      />

      {/* Simple Role Selector (can customize later) */}
      <View className="mb-4 flex-row gap-3">
        {['student', 'faculty', 'hod'].map((r) => (
          <TouchableOpacity
            key={r}
            className={`rounded px-3 py-2 ${role === r ? 'bg-blue-500' : 'bg-gray-200'}`}
            onPress={() => setRole(r)}
            disabled={loading}>
            <Text className={role === r ? 'text-white' : 'text-gray-800'}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        className="rounded bg-blue-600 px-5 py-3"
        onPress={handleLogin}
        disabled={loading}
        style={loading ? { opacity: 0.6 } : {}}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-center font-medium text-white">Log In</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
