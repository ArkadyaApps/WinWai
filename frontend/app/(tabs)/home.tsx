import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useUserStore } from '../../src/store/userStore';
import { Raffle } from '../../src/types';
import api from '../../src/utils/api';
import RaffleCard from '../../src/components/RaffleCard';
import BannerAdComponent from '../../src/components/BannerAd';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const { user } = useUserStore();
  const router = useRouter();
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRaffles();
  }, []);

  const loadRaffles = async () => {
    try {
      const response = await api.get('/api/raffles');
      setRaffles(response.data.slice(0, 6));
    } catch (error) {
      console.error('Failed to load raffles:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadRaffles();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>Hello, {user?.name || 'Guest'}!</Text>
          <View style={styles.ticketBadge}>
            <Text style={styles.ticketIcon}>🎟️</Text>
            <Text style={styles.ticketText}>{user?.tickets || 0} tickets</Text>
          </View>
        </View>

        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeTitle}>Welcome to WinWai!</Text>
          <Text style={styles.welcomeText}>
            Enter free raffles and win amazing prizes in Thailand. Watch ads to earn more tickets!
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Raffles</Text>
          {raffles.map((raffle) => (
            <RaffleCard
              key={raffle.id}
              raffle={raffle}
              onPress={() => {/* Navigate to raffle details */}}
            />
          ))}
          
          {raffles.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No active raffles at the moment</Text>
            </View>
          )}
        </View>
      </ScrollView>
      
      <BannerAdComponent position="bottom" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFD700',
  },
  greeting: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  ticketBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  ticketIcon: {
    fontSize: 16,
  },
  ticketText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  welcomeCard: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 14,
    color: '#7F8C8D',
    lineHeight: 20,
  },
  section: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C3E50',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#95A5A6',
  },
});