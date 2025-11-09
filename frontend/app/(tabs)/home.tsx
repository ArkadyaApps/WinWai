import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Image,
  Platform,
} from 'react-native';
import { useUserStore } from '../../src/store/userStore';
import { Raffle } from '../../src/types';
import api from '../../src/utils/api';
import RaffleGridCard from '../../src/components/RaffleGridCard';
import BannerAdComponent from '../../src/components/BannerAd';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 8;
const CARD_WIDTH = (width - (CARD_MARGIN * 4)) / 3;

export default function HomeScreen() {
  const { user } = useUserStore();
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRaffles();
  }, []);

  const loadRaffles = async () => {
    try {
      const response = await api.get('/api/raffles');
      setRaffles(response.data);
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FFD700']} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Header with Logo */}
        <LinearGradient
          colors={['#FFD700', '#FFC200', '#FFB800']}
          style={styles.heroHeader}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.logoContainer}>
            <Image
              source={{ uri: 'https://customer-assets.emergentagent.com/job_raffleprize/artifacts/1bule6ml_logo.jpg' }}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.brandName}>WinWai</Text>
          </View>
          
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>Hello, {user?.name || 'Guest'}!</Text>
              <Text style={styles.subGreeting}>Ready to win amazing prizes?</Text>
            </View>
            
            <View style={styles.ticketBadge}>
              <Ionicons name="ticket" size={22} color="#FFB800" />
              <View>
                <Text style={styles.ticketLabel}>Tickets</Text>
                <Text style={styles.ticketCount}>{user?.tickets || 0}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <LinearGradient
              colors={['#FF6B6B', '#FF8E53']}
              style={styles.statGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="gift-outline" size={24} color="#fff" />
              <Text style={styles.statNumber}>{raffles.length}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </LinearGradient>
          </View>
          
          <View style={styles.statCard}>
            <LinearGradient
              colors={['#4ECDC4', '#44A08D']}
              style={styles.statGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="trophy-outline" size={24} color="#fff" />
              <Text style={styles.statNumber}>{raffles.reduce((sum, r) => sum + r.prizesAvailable, 0)}</Text>
              <Text style={styles.statLabel}>Prizes</Text>
            </LinearGradient>
          </View>
          
          <View style={styles.statCard}>
            <LinearGradient
              colors={['#A8E6CF', '#88D8B0']}
              style={styles.statGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="people-outline" size={24} color="#fff" />
              <Text style={styles.statNumber}>{raffles.reduce((sum, r) => sum + r.totalEntries, 0)}</Text>
              <Text style={styles.statLabel}>Entries</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Live Raffles</Text>
            <Text style={styles.sectionSubtitle}>Enter now to win!</Text>
          </View>
        </View>

        {/* Raffle Grid */}
        <View style={styles.gridContainer}>
          {raffles.map((raffle) => (
            <View key={raffle.id} style={{ width: CARD_WIDTH, marginHorizontal: CARD_MARGIN / 2 }}>
              <RaffleGridCard
                raffle={raffle}
                onPress={() => {/* Navigate to raffle details */}}
              />
            </View>
          ))}
        </View>
        
        {raffles.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="gift-outline" size={80} color="#E0E0E0" />
            <Text style={styles.emptyText}>No active raffles</Text>
            <Text style={styles.emptySubtext}>Check back soon for new prizes!</Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
      
      <BannerAdComponent position="bottom" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  heroHeader: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 24,
    paddingHorizontal: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  brandName: {
    fontSize: 26,
    fontWeight: '900',
    color: '#000',
    letterSpacing: 1,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 22,
    fontWeight: '800',
    color: '#000',
    marginBottom: 2,
  },
  subGreeting: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  ticketBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    gap: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  ticketLabel: {
    fontSize: 10,
    color: '#666',
    fontWeight: '600',
  },
  ticketCount: {
    fontSize: 18,
    fontWeight: '900',
    color: '#000',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  statGradient: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 8,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#2C3E50',
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#7F8C8D',
    fontWeight: '600',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: CARD_MARGIN / 2,
  },
  emptyState: {
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C3E50',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#95A5A6',
  },
});