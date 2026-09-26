import React, { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import WwIcon from '../../src/components/ui/WwIcon';
import { View, ActivityIndicator } from 'react-native';
import { useUserStore } from '../../src/store/userStore';
import { useLanguageStore } from '../../src/store/languageStore';
import { translations } from '../../src/utils/translations';

export default function TabLayout() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useUserStore();
  const { language } = useLanguageStore();
  const t = translations[language];

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FFD700',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          paddingBottom: 8,
          paddingTop: 8,
          height: 70,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t.home,
          tabBarIcon: ({ color, size }) => (
            <WwIcon name="home" size={size + 2} color={color} strokeWidth={1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="raffles"
        options={{
          title: t.raffles,
          tabBarIcon: ({ color, size }) => (
            <WwIcon name="gift" size={size + 2} color={color} strokeWidth={1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="tickets"
        options={{
          title: t.tickets,
          tabBarIcon: ({ color, size }) => (
            <WwIcon name="ticket" size={size + 2} color={color} strokeWidth={1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="rewards"
        options={{
          title: t.myRewards,
          tabBarIcon: ({ color, size }) => (
            <WwIcon name="trophy" size={size + 2} color={color} strokeWidth={1.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t.profile,
          tabBarIcon: ({ color, size }) => (
            <WwIcon name="user" size={size + 2} color={color} strokeWidth={1.5} />
          ),
        }}
      />
    </Tabs>
  );
}