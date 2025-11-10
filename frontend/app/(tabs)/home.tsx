import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, Dimensions, TouchableOpacity } from 'react-native';
import { useUserStore } from '../../src/store/userStore';
import { useLanguageStore } from '../../src/store/languageStore';
import { Raffle } from '../../src/types';
import api from '../../src/utils/api';
import RaffleGridCard from '../../src/components/RaffleGridCard';
import BannerAdComponent from '../../src/components/BannerAd';
import SearchFilterMenu from '../../src/components/SearchFilterMenu';
import LanguageSelector from '../../src/components/LanguageSelector';
import { Ionicons } from '@expo/vector-icons';
import { getUserLocation } from '../../src/utils/locationService';
import { useRouter } from 'expo-router';
import { translations, getLanguageFromCountry } from '../../src/utils/translations';
import AppHeader from '../../src/components/AppHeader';
import { theme } from '../../src/theme/tokens';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 8;
const CARD_WIDTH = (width - (CARD_MARGIN * 4)) / 3;
const LOGO_URI = 'https://customer-assets.emergentagent.com/job_raffle-rewards-1/artifacts/qlp006k7_logo.png';

export default function HomeScreen() {
  const { user } = useUserStore();
  const { language, setLanguage, initializeLanguage } = useLanguageStore();
  const router = useRouter();
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [userCity, setUserCity] = useState<string | null>(null);

  const t = translations[language];

  useEffect(() => { initialize(); }, []);
  useEffect(() => { loadRaffles(); }, [selectedCategory, selectedLocation]);

  const initialize = async () => { await initializeLanguage(); await detectLocation(); loadRaffles(); };

  const detectLocation = async () => {
    const location = await getUserLocation();
    if (location) {
      setUserCity(location.city);
      const savedLang = await require('@react-native-async-storage/async-storage').default.getItem('app_language');
      if (!savedLang) {
        const detectedLang = getLanguageFromCountry(location.country);
        await setLanguage(detectedLang);
      }
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

  const onRefresh = () => { setRefreshing(true); loadRaffles(); };

  if (loading) {
    return (<View style={styles.centered}><ActivityIndicator size="large" color={theme.colors.primaryGold} /></View>);
  }

  return (
    <View style={styles.container}>
      <AppHeader
        variant="gold"
        logoUri={LOGO_URI}
        showDivider
        right={(
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={styles.ticketBadge}><Ionicons name="ticket" size={18} color={theme.colors.primaryGold} /><Text style={styles.ticketText}>{user?.tickets || 0}</Text></View>
            <LanguageSelector />
            <TouchableOpacity style={styles.filterButton} onPress={() => setFilterVisible(true)}>
              <Ionicons name="options" size={20} color="#000" />
            </TouchableOpacity>
          </View>
        )}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primaryGold]} />} showsVerticalScrollIndicator={false}>
        {userCity && (
          <View style={styles.locationBanner}><Ionicons name="location" size={18} color={theme.colors.emeraldA} /><Text style={styles.locationText}>{t.nearbyIn} {userCity}</Text></View>
        )}

        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>{raffles.length} {t.raffles}</Text>
          {(selectedCategory !== 'all' || selectedLocation !== 'all') && (
            <TouchableOpacity onPress={() => { setSelectedCategory('all'); setSelectedLocation('all'); }} style={styles.clearButton}>
              <Text style={styles.clearText}>{t.clearFilters}</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.gridContainer}>
          {raffles.map((raffle) => (
            <View key={raffle.id} style={{ width: CARD_WIDTH, marginHorizontal: CARD_MARGIN / 2 }}>
              <RaffleGridCard raffle={raffle} onPress={() => router.push(`/raffle/${raffle.id}`)} />
            </View>
          ))}
        </View>

        {raffles.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="search" size={80} color={theme.colors.line} />
            <Text style={styles.emptyText}>{t.noRafflesFound}</Text>
            <Text style={styles.emptySubtext}>{t.tryAdjustingFilters}</Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
      <BannerAdComponent position="bottom" />
      <SearchFilterMenu visible={filterVisible} onClose={() => setFilterVisible(false)} selectedCategory={selectedCategory} selectedLocation={selectedLocation} onCategoryChange={setSelectedCategory} onLocationChange={setSelectedLocation} userCity={userCity || undefined} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.cloud },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.cloud },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 80 },
  ticketBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, gap: 4 },
  ticketText: { fontSize: 14, fontWeight: '800', color: '#000' },
  filterButton: { backgroundColor: '#fff', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  locationBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F8F5', marginHorizontal: 16, marginTop: 16, padding: 12, borderRadius: 12, gap: 8 },
  locationText: { fontSize: 14, fontWeight: '600', color: theme.colors.onyx },
  resultsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16 },
  resultsCount: { fontSize: 20, fontWeight: '800', color: theme.colors.onyx },
  clearButton: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#FFE6E6', borderRadius: 12 },
  clearText: { fontSize: 12, fontWeight: '700', color: '#FF6B6B' },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: CARD_MARGIN / 2 },
  emptyState: { padding: 48, alignItems: 'center' },
  emptyText: { fontSize: 18, fontWeight: '700', color: theme.colors.onyx, marginTop: 16, marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#95A5A6' },
});
