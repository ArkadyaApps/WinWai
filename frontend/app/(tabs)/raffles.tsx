import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Dimensions } from 'react-native';
import { Raffle } from '../../src/types';
import api from '../../src/utils/api';
import RaffleGridCard from '../../src/components/RaffleGridCard';
import BannerAdComponent from '../../src/components/BannerAd';
import AppHeader from '../../src/components/AppHeader';
import LocationFilter from '../../src/components/LocationFilter';
import { theme } from '../../src/theme/tokens';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 8;
const CARD_WIDTH = (width - (CARD_MARGIN * 4)) / 3;
const LOGO_URI = 'https://customer-assets.emergentagent.com/job_raffle-rewards-1/artifacts/tsv1bcjh_logo.png';

const categories = [
  { id: 'all', name: 'All', emoji: '🎉' },
  { id: 'food', name: 'Food', emoji: '🍽️' },
  { id: 'hotel', name: 'Hotels', emoji: '🏨' },
  { id: 'spa', name: 'Spa', emoji: '💆' },
  { id: 'gift-cards', name: 'Gift Cards', emoji: '🎁' },
  { id: 'electronics', name: 'Electronics', emoji: '📱' },
  { id: 'voucher', name: 'Vouchers', emoji: '🎟️' },
];

export default function RafflesScreen() {
  const router = useRouter();
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadRaffles(); }, [selectedCategory, selectedLocation]);

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

  const onRefresh = () => { setRefreshing(true); loadRaffles(); };

  return (
    <View style={styles.container}>
      <AppHeader variant="mint" logoUri={LOGO_URI} showDivider />

      {/* Category Filter */}
      <View style={styles.categoryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {categories.map((cat) => (
            <TouchableOpacity key={cat.id} style={[styles.categoryButton, selectedCategory === cat.id && styles.categoryButtonActive]} onPress={() => setSelectedCategory(cat.id)}>
              <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
              <Text style={[styles.categoryText, selectedCategory === cat.id && styles.categoryTextActive]}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Location Filter */}
      <LocationFilter 
        selectedLocation={selectedLocation} 
        onLocationChange={setSelectedLocation} 
      />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primaryGold} />
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primaryGold]} />} showsVerticalScrollIndicator={false}>
          <View style={styles.resultsHeader}><Text style={styles.resultsText}>{raffles.length} {raffles.length === 1 ? 'Raffle' : 'Raffles'} Available</Text></View>
          <View style={styles.gridContainer}>
            {raffles.map((raffle) => (
              <View key={raffle.id} style={{ width: CARD_WIDTH, marginHorizontal: CARD_MARGIN / 2 }}>
                <RaffleGridCard raffle={raffle} onPress={() => router.push(`/raffle/${raffle.id}`)} />
              </View>
            ))}
          </View>
          {raffles.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🎁</Text>
              <Text style={styles.emptyText}>No raffles matching filters</Text>
              <Text style={styles.emptySubtext}>Try changing category or location</Text>
            </View>
          )}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      <BannerAdComponent position="bottom" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.cloud },
  categoryContainer: { backgroundColor: '#ffffff', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#E8E8E8' },
  categoryScroll: { paddingHorizontal: 16, gap: 10 },
  categoryButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, backgroundColor: '#F8F9FA', gap: 8, borderWidth: 2, borderColor: '#E1E8ED', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  categoryButtonActive: { backgroundColor: theme.colors.primaryGold, borderColor: theme.colors.primaryGold, shadowColor: theme.colors.primaryGold, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  categoryEmoji: { fontSize: 20 },
  categoryText: { fontSize: 15, fontWeight: '600', color: theme.colors.slate },
  categoryTextActive: { color: '#fff', fontWeight: '800' },

  locationContainer: { backgroundColor: theme.colors.cloud, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#EDEDED' },
  locationScroll: { paddingHorizontal: 16, gap: 8 },
  locationPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, backgroundColor: '#ECEFF1' },
  locationPillActive: { backgroundColor: theme.colors.emeraldA },
  locationText: { color: theme.colors.onyx, fontWeight: '600' },
  locationTextActive: { color: '#fff' },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 80 },
  resultsHeader: { paddingHorizontal: 20, paddingVertical: 16 },
  resultsText: { fontSize: 16, fontWeight: '700', color: theme.colors.onyx },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: CARD_MARGIN / 2 },
  emptyState: { padding: 48, alignItems: 'center' },
  emptyIcon: { fontSize: 72, marginBottom: 16 },
  emptyText: { fontSize: 18, fontWeight: '700', color: theme.colors.onyx, marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#95A5A6', textAlign: 'center' },
});
