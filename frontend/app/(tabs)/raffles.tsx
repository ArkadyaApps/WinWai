import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Dimensions } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Raffle } from '../../src/types';
import api from '../../src/utils/api';
import RaffleGridCard from '../../src/components/RaffleGridCard';
import BannerAdComponent from '../../src/components/BannerAd';
import AppHeader from '../../src/components/AppHeader';
import { theme } from '../../src/theme/tokens';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 8;
const CARD_WIDTH = (width - (CARD_MARGIN * 4)) / 3;
const LOGO_URI = 'https://customer-assets.emergentagent.com/job_raffle-rewards-1/artifacts/tsv1bcjh_logo.png';

export default function RafflesScreen() {
  const router = useRouter();
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);

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

      {/* Simple Filter Row */}
      <View style={styles.filterRow}>
        {/* All Button */}
        <TouchableOpacity 
          style={[styles.filterButton, selectedCategory === 'all' && selectedLocation === 'all' && styles.filterButtonActive]}
          onPress={() => { setSelectedCategory('all'); setSelectedLocation('all'); }}
        >
          <Text style={[styles.filterButtonText, selectedCategory === 'all' && selectedLocation === 'all' && styles.filterButtonTextActive]}>All</Text>
        </TouchableOpacity>

        {/* Category Dropdown */}
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedCategory}
            onValueChange={(value) => setSelectedCategory(value)}
            style={styles.picker}
          >
            <Picker.Item label="All Categories" value="all" />
            <Picker.Item label="Food & Dining" value="food" />
            <Picker.Item label="Hotels" value="hotel" />
            <Picker.Item label="Spa & Wellness" value="spa" />
            <Picker.Item label="Gift Cards" value="gift-cards" />
            <Picker.Item label="Electronics" value="electronics" />
            <Picker.Item label="Vouchers" value="voucher" />
          </Picker>
        </View>

        {/* Location Dropdown */}
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedLocation}
            onValueChange={(value) => setSelectedLocation(value)}
            style={styles.picker}
          >
            <Picker.Item label="All Locations" value="all" />
            <Picker.Item label="📍 Near Me" value="nearme" />
            <Picker.Item label="Bangkok" value="Bangkok" />
            <Picker.Item label="Chiang Mai" value="Chiang Mai" />
            <Picker.Item label="Phuket" value="Phuket" />
            <Picker.Item label="Pattaya" value="Pattaya" />
          </Picker>
        </View>
      </View>

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
  filterChipsScroll: { marginTop: 12, backgroundColor: '#fff', paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#E8E8E8' },
  filterChipsContainer: { paddingHorizontal: 16, gap: 8, paddingVertical: 4 },
  filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#fff', borderRadius: 20, borderWidth: 1.5, borderColor: theme.colors.line, gap: 6, marginRight: 8 },
  filterChipActive: { backgroundColor: theme.colors.primaryGold, borderColor: theme.colors.primaryGold },
  filterChipText: { fontSize: 13, fontWeight: '600', color: theme.colors.onyx },
  filterChipTextActive: { color: '#fff', fontWeight: '700' },
  filterChipMore: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#FFF9E6', borderRadius: 20, borderWidth: 1.5, borderColor: theme.colors.primaryGold, gap: 6, marginRight: 16 },
  filterChipMoreText: { fontSize: 13, fontWeight: '700', color: theme.colors.primaryGold },

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
