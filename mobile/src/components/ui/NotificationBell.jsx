import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { apiFetch } from '../../utils';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { currentUser } = useAuth();

  const fetchNotifications = useCallback(async () => {
    try {
      const endpoint =
        currentUser.role === 'student'
          ? `/student/notifications?userId=${currentUser.student_id || currentUser.user_id}`
          : `/faculty/notifications?userId=${currentUser.faculty_id || currentUser.user_id}`;

      const data = await apiFetch(endpoint);
      const notificationArray = Array.isArray(data) ? data : [];
      setNotifications(notificationArray);
      setUnreadCount(notificationArray.filter((n) => !n.read).length);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [currentUser]);

  const markAsRead = async (notificationId) => {
    if (currentUser.role === 'faculty' && notificationId === 'pending-requests') {
      return;
    }

    try {
      await apiFetch(`/notifications/${notificationId}/read`, { method: 'PUT' });
      setNotifications((prev) =>
        Array.isArray(prev)
          ? prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
          : []
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const clearAllNotifications = async () => {
    Alert.alert('Clear Notifications', 'Are you sure you want to clear all notifications?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear All',
        style: 'destructive',
        onPress: async () => {
          try {
            const userId = currentUser.student_id || currentUser.faculty_id || currentUser.user_id;
            await apiFetch(`/notifications/clear?userId=${userId}`, { method: 'DELETE' });
            setNotifications([]);
            setUnreadCount(0);
          } catch (err) {
            console.error('Failed to clear notifications:', err);
          }
        },
      },
    ]);
  };

  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [currentUser, fetchNotifications]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'accepted':
        return 'checkmark-circle';
      case 'rejected':
        return 'close-circle';
      case 'suspended':
        return 'pause-circle';
      default:
        return 'time';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted':
        return '#10B981';
      case 'rejected':
        return '#EF4444';
      case 'suspended':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  return (
    <>
      <TouchableOpacity onPress={() => setIsOpen(true)} className="relative p-2">
        <Ionicons name="notifications" size={24} color="#374151" />
        {unreadCount > 0 && (
          <View className="absolute -right-1 -top-1 h-5 min-w-5 items-center justify-center rounded-full bg-red-500">
            <Text className="text-xs font-bold text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsOpen(false)}>
        <View className="flex-1 bg-white">
          <View className="flex-row items-center justify-between border-b border-gray-200 p-4">
            <Text className="text-lg font-semibold">Notifications</Text>
            <View className="flex-row gap-4">
              {notifications.length > 0 && (
                <TouchableOpacity onPress={clearAllNotifications}>
                  <Text className="text-sm text-red-500">Clear All</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setIsOpen(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView className="flex-1">
            {notifications.length === 0 ? (
              <View className="flex-1 items-center justify-center p-8">
                <Ionicons name="notifications-off" size={48} color="#9CA3AF" />
                <Text className="mt-4 text-gray-500">No notifications</Text>
              </View>
            ) : (
              (Array.isArray(notifications) &&
                notifications.map((notification) => (
                  <TouchableOpacity
                    key={notification.id}
                    className={`border-b border-gray-100 p-4 ${!notification.read ? 'bg-blue-50' : ''}`}
                    onPress={() => {
                      if (
                        currentUser.role !== 'faculty' ||
                        notification.id !== 'pending-requests'
                      ) {
                        !notification.read && markAsRead(notification.id);
                      }
                    }}>
                    <View className="flex-row items-start gap-3">
                      <Ionicons
                        name={getStatusIcon(notification.status)}
                        size={20}
                        color={getStatusColor(notification.status)}
                      />
                      <View className="flex-1">
                        <Text className="font-medium text-gray-800">{notification.title}</Text>
                        <Text className="mt-1 text-sm text-gray-600">{notification.message}</Text>
                        <Text className="mt-2 text-xs text-gray-400">
                          {new Date(notification.created_at).toLocaleDateString()}
                        </Text>
                      </View>
                      {!notification.read && (
                        <View className="h-2 w-2 rounded-full bg-blue-500"></View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))) ||
              []
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
};

export default NotificationBell;
