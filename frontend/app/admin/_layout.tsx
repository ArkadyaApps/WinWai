import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { View, ActivityIndicator, Alert } from 'react-native';
import { useUserStore } from '../../src/store/userStore';
import { useAdminStore } from '../../src/store/adminStore';

export default function AdminLayout() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useUserStore();
  const { adminMode } = useAdminStore();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        Alert.alert('Authentication Required', 'Please login to access admin features');
        router.replace('/');
      } else if (user?.role !== 'admin') {
        Alert.alert('Access Denied', 'Admin privileges required');
        router.replace('/(tabs)/profile');
      } else if (!adminMode) {
        Alert.alert('Admin Mode Required', 'Please enable Admin Mode from your profile');
        router.replace('/(tabs)/profile');
      }
    }
  }, [isAuthenticated, isLoading, user, adminMode]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }

  if (!isAuthenticated || user?.role !== 'admin' || !adminMode) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="partners" />
      <Stack.Screen name="users" />
      <Stack.Screen name="raffles" />
    </Stack>
  );
}
