import React from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import Home from '../screens/Home';
import StudentDashboard from '../screens/dashboards/StudentDashboard';
import FacultyDashboard from '../screens/dashboards/FacultyDashboard';
import HeadDashboard from '../screens/dashboards/HeadDashboard';
import RankingScreen from '../screens/RankingScreen';
import ProfileScreen from '../screens/ProfileScreen';
// Admin role not supported in mobile app

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const AppNavigation = () => {
  const { currentUser, userRole, loading } = useAuth();

  if (loading) return <Stack.Screen name="Home" component={Home} />; // or show a splash/loading screen

  const StudentTabs = () => (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = 'home';
          else if (route.name === 'Rankings') iconName = 'trophy';
          else if (route.name === 'Profile') iconName = 'person';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}>
      <Tab.Screen name="Home" component={StudentDashboard} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="Rankings" component={RankingScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );

  const getDashboard = () => {
    switch (userRole) {
      case 'student':
        return StudentTabs;
      case 'faculty':
        return FacultyDashboard;
      case 'hod':
        return HeadDashboard;
      case 'admin':
        // Admin role not supported in mobile app
        return () => (
          <View className="flex-1 items-center justify-center p-6">
            <Ionicons name="desktop" size={64} color="#9CA3AF" />
            <Text className="mt-4 text-center text-lg font-semibold">Admin Dashboard</Text>
            <Text className="mt-2 text-center text-gray-600">
              Admin features are only available on the web platform. Please use a computer to access
              admin functions.
            </Text>
          </View>
        );
      default:
        return LoginScreen;
    }
  };

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!currentUser ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <Stack.Screen name="Main" component={getDashboard()} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigation;
