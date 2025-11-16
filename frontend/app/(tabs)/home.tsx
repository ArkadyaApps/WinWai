import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, Dimensions, TouchableOpacity, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
const LOGO_URI = 'https://customer-assets.emergentagent.com/job_raffle-rewards-1/artifacts/tsv1bcjh_logo.png';

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
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);

  const t = translations[language];

  // Check if this is the first time user visits after sign-in
  useEffect(() => {
    checkFirstTimeUser();
  }, [user]);

  const checkFirstTimeUser = async () => {
    if (!user) return;
    
    try {
      const hasSeenWelcome = await AsyncStorage.getItem('has_seen_welcome');
      if (!hasSeenWelcome) {
        // Show popup after a short delay for better UX
        setTimeout(() => {
          setShowWelcomePopup(true);
        }, 500);
      }
    } catch (error) {
      console.error('Error checking first time user:', error);
    }
  };

  const handleCloseWelcomePopup = async () => {
    try {
      await AsyncStorage.setItem('has_seen_welcome', 'true');
      setShowWelcomePopup(false);
    } catch (error) {
      console.error('Error saving welcome popup state:', error);
    }
  };

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
            <TouchableOpacity onPress={() => router.push('/(tabs)/tickets')} style={styles.ticketBadge}>
              <Ionicons name="ticket" size={18} color={theme.colors.primaryGold} />
              <Text style={styles.ticketText}>{user?.tickets || 0}</Text>
            </TouchableOpacity>
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
      
      {/* First-Time Welcome Popup */}
      <Modal
        visible={showWelcomePopup}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseWelcomePopup}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.welcomePopup}>
            <View style={styles.welcomeHeader}>
              <Ionicons name="information-circle" size={50} color={theme.colors.primaryGold} />
              <Text style={styles.welcomeTitle}>{t.howItWorks}</Text>
            </View>
            
            <View style={styles.welcomeSteps}>
              <View style={styles.welcomeStep}>
                <Text style={styles.stepIcon}>🎫</Text>
                <Text style={styles.stepText}>{t.earnTicketsStep}</Text>
              </View>
              <Text style={styles.stepArrow}>→</Text>
              
              <View style={styles.welcomeStep}>
                <Text style={styles.stepIcon}>🎥</Text>
                <Text style={styles.stepText}>{t.watchAdsStep}</Text>
              </View>
              <Text style={styles.stepArrow}>→</Text>
              
              <View style={styles.welcomeStep}>
                <Text style={styles.stepIcon}>🎰</Text>
                <Text style={styles.stepText}>{t.enterRafflesStep}</Text>
              </View>
              <Text style={styles.stepArrow}>→</Text>
              
              <View style={styles.welcomeStep}>
                <Text style={styles.stepIcon}>🎁</Text>
                <Text style={styles.stepText}>{t.winPrizesStep}</Text>
              </View>
            </View>
            
            <TouchableOpacity style={styles.welcomeButton} onPress={handleCloseWelcomePopup}>
              <Text style={styles.welcomeButtonText}>{t.gotIt}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#444', marginTop: 16, marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#95A5A6' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  welcomePopup: { backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 400, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  welcomeHeader: { alignItems: 'center', marginBottom: 24 },
  welcomeTitle: { fontSize: 24, fontWeight: 'bold', color: theme.colors.onyx, marginTop: 12 },
  welcomeSteps: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24, gap: 8 },
  welcomeStep: { alignItems: 'center', padding: 12, backgroundColor: '#F8F9FA', borderRadius: 12, minWidth: 70 },
  stepIcon: { fontSize: 32, marginBottom: 8 },
  stepText: { fontSize: 12, fontWeight: '600', color: theme.colors.onyx, textAlign: 'center' },
  stepArrow: { fontSize: 20, color: theme.colors.primaryGold, marginHorizontal: 4 },
  welcomeButton: { backgroundColor: theme.colors.primaryGold, padding: 16, borderRadius: 12, alignItems: 'center' },
  welcomeButtonText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
});
