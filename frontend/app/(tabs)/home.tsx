import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useUserStore } from '../../src/store/userStore';
import { Raffle } from '../../src/types';
import api from '../../src/utils/api';
import RaffleGridCard from '../../src/components/RaffleGridCard';
import BannerAdComponent from '../../src/components/BannerAd';
import SearchFilterMenu from '../../src/components/SearchFilterMenu';
import { Ionicons } from '@expo/vector-icons';
import { getUserLocation } from '../../src/utils/locationService';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 8;
const CARD_WIDTH = (width - (CARD_MARGIN * 4)) / 3;

export default function HomeScreen() {
  const { user } = useUserStore();
  const router = useRouter();
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [userCity, setUserCity] = useState<string | null>(null);

  useEffect(() => {
    detectLocation();
    loadRaffles();
  }, []);

  useEffect(() => {
    loadRaffles();
  }, [selectedCategory, selectedLocation]);

  const detectLocation = async () => {
    const location = await getUserLocation();
    if (location) {
      setUserCity(location.city);
    }
  };

  const loadRaffles = async () => {
    try {
      const params: any = {};
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (selectedLocation !== 'all') params.location = selectedLocation;
      
      const response = await api.get('/api/raffles', { params });
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
      {/* Top Bar with Tickets and Filter */}
      <View style={styles.topBar}>
        <View style={styles.ticketBadge}>
          <Ionicons name="ticket" size={20} color="#FFD700" />
          <Text style={styles.ticketText}>{user?.tickets || 0}</Text>
        </View>
        
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setFilterVisible(true)}
        >
          <Ionicons name="options" size={24} color="#000" />
          <Text style={styles.filterText}>Filter</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FFD700']} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Location Banner */}
        {userCity && (
          <View style={styles.locationBanner}>
            <Ionicons name="location" size={18} color="#4ECDC4" />
            <Text style={styles.locationText}>Nearby in {userCity}</Text>
          </View>
        )}

        {/* Results Header */}
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>{raffles.length} Raffles</Text>
          {(selectedCategory !== 'all' || selectedLocation !== 'all') && (
            <TouchableOpacity 
              onPress={() => {
                setSelectedCategory('all');
                setSelectedLocation('all');
              }}
              style={styles.clearButton}
            >
              <Text style={styles.clearText}>Clear Filters</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Raffle Grid */}
        <View style={styles.gridContainer}>
          {raffles.map((raffle) => (
            <View key={raffle.id} style={{ width: CARD_WIDTH, marginHorizontal: CARD_MARGIN / 2 }}>
              <RaffleGridCard
                raffle={raffle}
                onPress={() => router.push(`/raffle/${raffle.id}`)}
              />
            </View>
          ))}
        </View>
        
        {raffles.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="search" size={80} color="#E0E0E0" />
            <Text style={styles.emptyText}>No raffles found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your filters</Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
      
      <BannerAdComponent position="bottom" />
      
      <SearchFilterMenu
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        selectedCategory={selectedCategory}
        selectedLocation={selectedLocation}
        onCategoryChange={setSelectedCategory}
        onLocationChange={setSelectedLocation}
        userCity={userCity || undefined}
      />
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 50 : 12,
    backgroundColor: '#FFD700',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  ticketBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  ticketText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  locationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F8F5',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  resultsCount: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2C3E50',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FFE6E6',
    borderRadius: 12,
  },
  clearText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF6B6B',
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
