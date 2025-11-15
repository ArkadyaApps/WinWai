import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { View, ActivityIndicator, Alert } from 'react-native';
import { useUserStore } from '../../src/store/userStore';
import { useAdminStore } from '../../src/store/adminStore';

export default function AdminLayout() {
  console.log('==================== ADMIN LAYOUT MOUNTED ====================');
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useUserStore();
  const { adminMode } = useAdminStore();

  console.log('Admin Layout State:', { isAuthenticated, isLoading, userRole: user?.role, adminMode });

  useEffect(() => {
    console.log('Admin Layout useEffect triggered');
    if (!isLoading) {
      if (!isAuthenticated) {
        console.log('❌ Not authenticated, redirecting to /');
        Alert.alert('Authentication Required', 'Please login to access admin features');
        router.replace('/');
      } else if (user?.role !== 'admin') {
        console.log('❌ Not admin, redirecting to profile');
        Alert.alert('Access Denied', 'Admin privileges required');
        router.replace('/(tabs)/profile');
      } else if (!adminMode) {
        console.log('❌ Admin mode disabled, redirecting to profile');
        Alert.alert('Admin Mode Required', 'Please enable Admin Mode from your profile');
        router.replace('/(tabs)/profile');
      } else {
        console.log('✅ All checks passed, admin access granted');
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
