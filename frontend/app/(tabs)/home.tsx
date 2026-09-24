import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, Dimensions, TouchableOpacity } from 'react-native';
import { useUserStore } from '../../src/store/userStore';
import { useLanguageStore } from '../../src/store/languageStore';
import { Raffle, Partner } from '../../src/types';
import api from '../../src/utils/api';
import RaffleGridCard from '../../src/components/RaffleGridCard';
import SponsorCard from '../../src/components/SponsorCard';
import WinnersTicker from '../../src/components/WinnersTicker';
import AdCard from '../../src/components/AdCard';
import BannerAdComponent from '../../src/components/BannerAd';
import LanguageSelector from '../../src/components/LanguageSelector';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { translations } from '../../src/utils/translations';
import AppHeader from '../../src/components/AppHeader';
import { theme } from '../../src/theme/tokens';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 8;
const CARD_WIDTH = (width - (CARD_MARGIN * 4)) / 3;
const LOGO_URI = 'https://customer-assets.emergentagent.com/job_raffle-rewards-1/artifacts/tsv1bcjh_logo.png';

export default function HomeScreen() {
  const { user } = useUserStore();
  const { language } = useLanguageStore();
  const router = useRouter();
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [sponsors, setSponsors] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const t = translations[language];

  // Raffles and sponsors load immediately; the app language is initialized at
  // startup in the root layout (default Thai, detected from the visitor's IP).
  useEffect(() => {
    loadRaffles();
    loadSponsors();
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
  // an easily-skipped section. The first ad shows right after the 3rd raffle
  // (so it's seen even without much scrolling), then repeats every
  // AD_INTERVAL after that; a raffle list too short to even reach position 3
  // still gets one ad appended at the end. Each sponsor appears once (extras
  // beyond what fits at the interval are appended at the end rather than
  // dropped). When a sponsor and an ad would land on the same slot, the
  // sponsor wins and the ad just waits for its next interval.
  type GridItem =
    | { key: string; kind: 'raffle'; raffle: Raffle }
    | { key: string; kind: 'sponsor'; partner: Partner }
    | { key: string; kind: 'ad' };
  const SPONSOR_INTERVAL = 6;
  const AD_FIRST_POSITION = 3;
  const AD_INTERVAL = 9;
  const gridItems: GridItem[] = useMemo(() => {
    const items: GridItem[] = [];
    let sponsorIndex = 0;
    let adCount = 0;
    raffles.forEach((raffle, i) => {
      items.push({ key: `raffle-${raffle.id}`, kind: 'raffle', raffle });
      const position = i + 1;
      const isAdPosition = position === AD_FIRST_POSITION || (position > AD_FIRST_POSITION && (position - AD_FIRST_POSITION) % AD_INTERVAL === 0);
      if (position % SPONSOR_INTERVAL === 0 && sponsorIndex < sponsors.length) {
        items.push({ key: `sponsor-${sponsors[sponsorIndex].id}`, kind: 'sponsor', partner: sponsors[sponsorIndex] });
        sponsorIndex++;
      } else if (isAdPosition) {
        adCount++;
        items.push({ key: `ad-${adCount}`, kind: 'ad' });
      }
    });
    while (sponsorIndex < sponsors.length) {
      items.push({ key: `sponsor-${sponsors[sponsorIndex].id}`, kind: 'sponsor', partner: sponsors[sponsorIndex] });
      sponsorIndex++;
    }
    // A raffle list shorter than AD_FIRST_POSITION would otherwise never
    // show an ad card at all - guarantee at least one whenever there's any
    // content, same as sponsors always getting shown regardless of list length.
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

      <WinnersTicker />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primaryGold]} />} showsVerticalScrollIndicator={false}>
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>{raffles.length} {t.raffles}</Text>
        </View>

        <View style={styles.gridContainer}>
          {gridItems.map((item) =>
            item.kind === 'ad' ? (
              // Google's fluid in-feed format needs at least 250px of width
              // to render at all (anything narrower gets outright rejected,
              // "Fluid responsive ads must be at least 250px wide") - a
              // 1/3-of-row grid cell never clears that on a phone. Full
              // width forces a line break in the wrapping flex-wrap row, so
              // it reads as a wide "sponsored" card between rows instead of
              // a grid tile.
              <View key={item.key} style={{ width: '100%', paddingHorizontal: CARD_MARGIN / 2 }}>
                <AdCard />
              </View>
            ) : (
              <View key={item.key} style={{ width: CARD_WIDTH, marginHorizontal: CARD_MARGIN / 2 }}>
                {item.kind === 'raffle' ? (
                  <RaffleGridCard raffle={item.raffle} onPress={() => router.push(`/raffle/${item.raffle.id}`)} />
                ) : (
                  <SponsorCard partner={item.partner} />
                )}
              </View>
            )
          )}
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
});
