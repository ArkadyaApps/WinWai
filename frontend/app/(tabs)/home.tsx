import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, Dimensions, TouchableOpacity, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserStore } from '../../src/store/userStore';
import { useLanguageStore } from '../../src/store/languageStore';
import { Raffle, Partner } from '../../src/types';
import api from '../../src/utils/api';
import RaffleGridCard from '../../src/components/RaffleGridCard';
import SponsorCard from '../../src/components/SponsorCard';
import AdCard from '../../src/components/AdCard';
import BannerAdComponent from '../../src/components/BannerAd';
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
  const [sponsors, setSponsors] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

  // Geolocation (browser permission prompt + GPS/IP lookup) can take
  // several seconds, or hang indefinitely on web if the user ignores the
  // permission prompt. Load raffles immediately so the screen isn't blocked
  // on it; location/language detection run in the background and refine
  // what's shown (via the userCity effect below) once they resolve.
  useEffect(() => {
    loadRaffles();
    loadSponsors();
    initializeLanguage();
    detectLocation();
  }, []);

  useEffect(() => {
    if (userCity) loadRaffles();
  }, [userCity]);

  const detectLocation = async () => {
    const location = await getUserLocation();
    if (location) {
      setUserCity(location.city);
      const savedLang = await AsyncStorage.getItem('app_language');
      if (!savedLang) {
        const detectedLang = getLanguageFromCountry(location.country);
        await setLanguage(detectedLang);
      }
    }
  };

  const loadRaffles = async () => {
    try {
      // Only show raffles near user's location on home page
      const params: any = {};
      if (userCity) params.location = userCity;
      const response = await api.get('/api/raffles', { params });
      setRaffles(response.data);
    } catch (error) {
      console.error('Failed to load raffles:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadSponsors = async () => {
    try {
      const response = await api.get('/api/partners', { params: { sponsored: 'true' } });
      setSponsors(response.data);
    } catch (error) {
      console.error('Failed to load sponsors:', error);
    }
  };

  const onRefresh = () => { setRefreshing(true); loadRaffles(); loadSponsors(); };

  // Interleave sponsor and ad cards into the raffle grid instead of grouping
  // them separately, so they get seen while browsing rather than sitting in
  // an easily-skipped section. Each sponsor appears once (extras beyond what
  // fits at the interval are appended at the end rather than dropped); ad
  // cards repeat every AD_INTERVAL throughout (falling back to one guaranteed
  // slot if the raffle list is too short to ever reach that interval), since
  // ad inventory isn't limited the way the sponsor list is. When both would
  // land on the same slot, the sponsor wins and the ad just waits for its
  // next interval.
  type GridItem =
    | { key: string; kind: 'raffle'; raffle: Raffle }
    | { key: string; kind: 'sponsor'; partner: Partner }
    | { key: string; kind: 'ad' };
  const SPONSOR_INTERVAL = 6;
  const AD_INTERVAL = 9;
  const gridItems: GridItem[] = useMemo(() => {
    const items: GridItem[] = [];
    let sponsorIndex = 0;
    let adCount = 0;
    raffles.forEach((raffle, i) => {
      items.push({ key: `raffle-${raffle.id}`, kind: 'raffle', raffle });
      const position = i + 1;
      if (position % SPONSOR_INTERVAL === 0 && sponsorIndex < sponsors.length) {
        items.push({ key: `sponsor-${sponsors[sponsorIndex].id}`, kind: 'sponsor', partner: sponsors[sponsorIndex] });
        sponsorIndex++;
      } else if (position % AD_INTERVAL === 0) {
        adCount++;
        items.push({ key: `ad-${adCount}`, kind: 'ad' });
      }
    });
    while (sponsorIndex < sponsors.length) {
      items.push({ key: `sponsor-${sponsors[sponsorIndex].id}`, kind: 'sponsor', partner: sponsors[sponsorIndex] });
      sponsorIndex++;
    }
    // A raffle list shorter than AD_INTERVAL would otherwise never show an
    // ad card at all - guarantee at least one whenever there's any content,
    // same as sponsors always getting shown regardless of list length.
    if (adCount === 0 && raffles.length > 0) {
      items.push({ key: 'ad-1', kind: 'ad' });
    }
    return items;
  }, [raffles, sponsors]);

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
          </View>
        )}
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primaryGold]} />} showsVerticalScrollIndicator={false}>
        {userCity && (
          <View style={styles.locationBanner}><Ionicons name="location" size={18} color={theme.colors.emeraldA} /><Text style={styles.locationText}>{t.nearbyIn} {userCity}</Text></View>
        )}

        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>{raffles.length} {t.raffles}</Text>
        </View>

        <View style={styles.gridContainer}>
          {gridItems.map((item) => (
            <View key={item.key} style={{ width: CARD_WIDTH, marginHorizontal: CARD_MARGIN / 2 }}>
              {item.kind === 'raffle' ? (
                <RaffleGridCard raffle={item.raffle} onPress={() => router.push(`/raffle/${item.raffle.id}`)} />
              ) : item.kind === 'sponsor' ? (
                <SponsorCard partner={item.partner} />
              ) : (
                <AdCard />
              )}
            </View>
          ))}
        </View>

        {raffles.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="gift-outline" size={80} color={theme.colors.primaryGold} />
            <Text style={styles.emptyText}>{t.noLocalRaffles}</Text>
            <Text style={styles.emptySubtext}>{t.noLocalRafflesSubtext}</Text>
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={() => router.push('/(tabs)/raffles')}
            >
              <Text style={styles.viewAllButtonText}>{t.viewAllRaffles}</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
      <BannerAdComponent position="bottom" />
      
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
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emptyText: { fontSize: 20, fontWeight: '700', color: '#333', marginTop: 16, marginBottom: 8, textAlign: 'center' },
  emptySubtext: { fontSize: 15, color: '#666', marginBottom: 24, textAlign: 'center', lineHeight: 22 },
  viewAllButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.primaryGold, paddingVertical: 14, paddingHorizontal: 28, borderRadius: 25, gap: 8, marginTop: 8 },
  viewAllButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
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
