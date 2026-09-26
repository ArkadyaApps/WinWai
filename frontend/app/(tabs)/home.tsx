import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
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
import WwIcon from '../../src/components/ui/WwIcon';
import AnimatedNumber from '../../src/components/ui/AnimatedNumber';
import TicketStrip from '../../src/components/TicketStrip';
import { useRouter } from 'expo-router';
import { translations } from '../../src/utils/translations';
import AppHeader from '../../src/components/AppHeader';
import { theme } from '../../src/theme/tokens';
import { ScreenFade, FadeInView } from '../../src/components/FadeInView';
import { useGrid, CARD_MARGIN } from '../../src/hooks/useGrid';
import { buildFeed } from '../../src/utils/feed';

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
  const { cardWidth, containerWidth } = useGrid();

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

  // Sponsors are spread evenly through the raffles and in-feed ads follow (see utils/feed.ts).
  const gridItems = useMemo(() => buildFeed(raffles, sponsors), [raffles, sponsors]);

  if (loading) {
    return (<View style={styles.centered}><ActivityIndicator size="large" color={theme.colors.primaryGold} /></View>);
  }

  return (
    <ScreenFade style={styles.container}>
      <AppHeader
        variant="gold"
        logoUri={LOGO_URI}
        showDivider
        right={(
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity onPress={() => router.push('/(tabs)/tickets')} style={styles.ticketBadge}>
              <WwIcon name="ticket" size={20} color="#E0A800" strokeWidth={1.7} />
              <AnimatedNumber value={user?.tickets || 0} style={styles.ticketText} />
            </TouchableOpacity>
            <LanguageSelector />
          </View>
        )}
      />

      <WinnersTicker />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primaryGold]} />} showsVerticalScrollIndicator={false}>
        <TicketStrip tickets={user?.tickets || 0} balanceLabel={t.yourTicketBalance} earnLabel="+1" accessibilityLabel={t.watchAdPlus1} />

        <View style={styles.resultsHeader}>
          <View style={styles.resultsTitleRow}>
            <View style={styles.liveDot} />
            <Text style={styles.resultsCount}>{raffles.length} {t.raffles}</Text>
          </View>
        </View>

        <View style={[styles.gridContainer, { width: containerWidth }]}>
          {gridItems.map((item, index) =>
            item.kind === 'ad' ? (
              // Google's fluid in-feed format needs at least 250px of width to
              // render, so the ad takes a full row between grid rows.
              <FadeInView key={item.key} delay={Math.min(index * 60, 400)} style={{ width: '100%', paddingHorizontal: CARD_MARGIN / 2 }}>
                <AdCard />
              </FadeInView>
            ) : (
              // Cards in a row stretch to the tallest one (each card fills its wrapper).
              <FadeInView key={item.key} delay={Math.min(index * 60, 400)} style={{ width: cardWidth, marginHorizontal: CARD_MARGIN / 2, marginBottom: 12 }}>
                {item.kind === 'raffle' ? (
                  <RaffleGridCard raffle={item.raffle} onPress={() => router.push(`/raffle/${item.raffle.id}`)} />
                ) : (
                  <SponsorCard partner={item.partner} />
                )}
              </FadeInView>
            )
          )}
        </View>

        {raffles.length === 0 && (
          <View style={styles.emptyState}>
            <WwIcon name="gift" size={84} color={theme.colors.primaryGold} strokeWidth={1} />
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
    </ScreenFade>
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
  resultsTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  liveDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#22C55E' },
  resultsCount: { fontSize: 20, fontWeight: '800', color: theme.colors.onyx },
  clearButton: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#FFE6E6', borderRadius: 12 },
  clearText: { fontSize: 12, fontWeight: '700', color: '#FF6B6B' },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: CARD_MARGIN / 2, alignSelf: 'center' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 32 },
  emptyText: { fontSize: 20, fontWeight: '700', color: '#333', marginTop: 16, marginBottom: 8, textAlign: 'center' },
  emptySubtext: { fontSize: 15, color: '#666', marginBottom: 24, textAlign: 'center', lineHeight: 22 },
  viewAllButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.primaryGold, paddingVertical: 14, paddingHorizontal: 28, borderRadius: 25, gap: 8, marginTop: 8 },
  viewAllButtonText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
