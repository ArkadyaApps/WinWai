import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Dimensions } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { Raffle } from '../../src/types';
import api from '../../src/utils/api';
import RaffleGridCard from '../../src/components/RaffleGridCard';
import BannerAdComponent from '../../src/components/BannerAd';
import AppHeader from '../../src/components/AppHeader';
import { theme } from '../../src/theme/tokens';
import { useRouter } from 'expo-router';
import { useLanguageStore } from '../../src/store/languageStore';
import { translations } from '../../src/utils/translations';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 8;
const CARD_WIDTH = (width - (CARD_MARGIN * 4)) / 3;
const LOGO_URI = 'https://customer-assets.emergentagent.com/job_raffle-rewards-1/artifacts/tsv1bcjh_logo.png';

export default function RafflesScreen() {
  const router = useRouter();
  const language = useLanguageStore((state) => state.language);
  const t = translations[language];
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [locations, setLocations] = useState<string[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(true);

  useEffect(() => { loadRaffles(); }, [selectedCategory, selectedLocation]);
  useEffect(() => { loadLocations(); }, []);

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

  const loadLocations = async () => {
    try {
      const response = await api.get('/api/raffles/locations');
      setLocations(response.data.locations || []);
    } catch (error) {
      console.error('Failed to load locations:', error);
    } finally {
      setLoadingLocations(false);
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
          <Text style={[styles.filterButtonText, selectedCategory === 'all' && selectedLocation === 'all' && styles.filterButtonTextActive]}>{t.allCategories?.split(' ')[0] || 'All'}</Text>
        </TouchableOpacity>

        {/* Category Dropdown */}
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedCategory}
            onValueChange={(value) => setSelectedCategory(value)}
            style={styles.picker}
          >
            <Picker.Item label={t.allCategories} value="all" />
            <Picker.Item label={t.foodDining} value="food" />
            <Picker.Item label={t.hotelsResorts} value="hotel" />
            <Picker.Item label={t.spaWellness} value="spa" />
            <Picker.Item label={t.giftCards} value="gift-cards" />
            <Picker.Item label={t.electronics} value="electronics" />
            <Picker.Item label={t.vouchers} value="voucher" />
          </Picker>
        </View>

        {/* Location Dropdown */}
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedLocation}
            onValueChange={(value) => setSelectedLocation(value)}
            style={styles.picker}
            enabled={!loadingLocations}
          >
            <Picker.Item label={t.allLocations} value="all" />
            <Picker.Item label={`📍 ${t.nearMe}`} value="nearme" />
            {locations.map((location) => (
              <Picker.Item key={location} label={location} value={location} />
            ))}
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
  filterRow: { flexDirection: 'row', padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E8E8E8', gap: 8, alignItems: 'center' },
  filterButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: '#F8F9FA', borderWidth: 1.5, borderColor: '#E1E8ED' },
  filterButtonActive: { backgroundColor: theme.colors.primaryGold, borderColor: theme.colors.primaryGold },
  filterButtonText: { fontSize: 13, fontWeight: '600', color: theme.colors.onyx },
  filterButtonTextActive: { color: '#fff', fontWeight: '700' },
  pickerWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: 10, backgroundColor: '#F8F9FA', borderWidth: 1.5, borderColor: '#E1E8ED', paddingLeft: 10, paddingRight: 8, position: 'relative' },
  pickerIcon: { marginRight: 4 },
  pickerContainer: { flex: 1, overflow: 'hidden' },
  picker: { height: 40, marginLeft: -8 },
  pickerChevron: { marginLeft: 4 },

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
