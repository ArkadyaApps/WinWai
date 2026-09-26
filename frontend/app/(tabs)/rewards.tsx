import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Voucher } from '../../src/types';
import api from '../../src/utils/api';
import BannerAdComponent from '../../src/components/BannerAd';
import VoucherCard from '../../src/components/VoucherCard';
import AppHeader from '../../src/components/AppHeader';
import { theme } from '../../src/theme/tokens';
import { isPast } from 'date-fns';
import { useTranslation } from '../../src/i18n/useTranslation';
import { ScreenFade } from '../../src/components/FadeInView';
import WwIcon from '../../src/components/ui/WwIcon';
import Bob from '../../src/components/ui/Bob';
import Reveal from '../../src/components/landing/Reveal';
import { FONT_DISPLAY } from '../../src/theme/fonts';

const LOGO_URI = '/logo.png';

export default function RewardsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [filteredVouchers, setFilteredVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'redeemed' | 'expired'>('all');

  useEffect(() => { loadVouchers(); }, []);

  useEffect(() => {
    // Apply filter
    switch (filter) {
      case 'active':
        setFilteredVouchers(vouchers.filter(v => v.status === 'active' && !isPast(new Date(v.validUntil))));
        break;
      case 'redeemed':
        setFilteredVouchers(vouchers.filter(v => v.status === 'redeemed'));
        break;
      case 'expired':
        setFilteredVouchers(vouchers.filter(v => v.status !== 'redeemed' && isPast(new Date(v.validUntil))));
        break;
      default:
        setFilteredVouchers(vouchers);
    }
  }, [filter, vouchers]);

  const loadVouchers = async () => {
    try { 
      const response = await api.get('/api/users/me/vouchers'); 
      setVouchers(Array.isArray(response.data) ? response.data : []); 
    }
    catch (error) { 
      console.error('Failed to load vouchers:', error); 
    }
    finally { 
      setLoading(false); 
      setRefreshing(false); 
    }
  };

  const onRefresh = () => { setRefreshing(true); loadVouchers(); };

  const handleVoucherPress = (voucher: Voucher) => {
    router.push(`/voucher/${voucher.id}`);
  };

  // Count vouchers by status
  const activeCount = vouchers.filter(v => v.status === 'active' && !isPast(new Date(v.validUntil))).length;
  const redeemedCount = vouchers.filter(v => v.status === 'redeemed').length;
  const expiredCount = vouchers.filter(v => v.status !== 'redeemed' && isPast(new Date(v.validUntil))).length;

  if (loading) {
    return (<View style={styles.centered}><ActivityIndicator size="large" color={theme.colors.primaryGold} /></View>);
  }

  return (
    <ScreenFade style={styles.container}>
      <AppHeader variant="gold" logoUri={LOGO_URI} showDivider />

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity 
            style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
            onPress={() => setFilter('all')}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
              {t('rewards.all')} ({vouchers.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterTab, filter === 'active' && styles.filterTabActive]}
            onPress={() => setFilter('active')}
          >
            <Text style={[styles.filterText, filter === 'active' && styles.filterTextActive]}>
              {t('rewards.active')} ({activeCount})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterTab, filter === 'redeemed' && styles.filterTabActive]}
            onPress={() => setFilter('redeemed')}
          >
            <Text style={[styles.filterText, filter === 'redeemed' && styles.filterTextActive]}>
              {t('rewards.redeemed')} ({redeemedCount})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.filterTab, filter === 'expired' && styles.filterTabActive]}
            onPress={() => setFilter('expired')}
          >
            <Text style={[styles.filterText, filter === 'expired' && styles.filterTextActive]}>
              {t('rewards.expired')} ({expiredCount})
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content} 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {filteredVouchers.length === 0 ? (
          <View style={styles.emptyState}>
            <Bob style={styles.emptyDisc}>
              <WwIcon name="trophy" size={44} color="#7A5C00" strokeWidth={1.3} />
            </Bob>
            <Text style={styles.emptyTitle}>
              {filter === 'all' ? t('rewards.noVouchersYet') : 
               filter === 'active' ? t('rewards.noActiveVouchers') :
               filter === 'redeemed' ? t('rewards.noRedeemedVouchers') :
               t('rewards.noExpiredVouchers')}
            </Text>
            <Text style={styles.emptyText}>
              {filter === 'all' ? t('rewards.winRafflesGetVouchers') : t('rewards.tryDifferentFilter')}
            </Text>
          </View>
        ) : (
          filteredVouchers.map((voucher, i) => (
            <Reveal key={voucher.id} delay={Math.min(i * 80, 400)}>
              <VoucherCard voucher={voucher} onPress={() => handleVoucherPress(voucher)} />
            </Reveal>
          ))
        )}
      </ScrollView>
      <BannerAdComponent position="bottom" />
    </ScreenFade>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.cloud },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filterContainer: { backgroundColor: theme.colors.cloud, paddingTop: 6 },
  filterScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterTab: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 999, backgroundColor: '#fff', borderWidth: 1, borderColor: 'rgba(44,62,80,0.08)' },
  filterTabActive: { backgroundColor: '#FFD700', borderColor: '#FFD700', ...Platform.select({ web: { boxShadow: '0 12px 22px -12px rgba(224,168,0,0.9)' } as any, default: {} }) },
  filterText: { fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: '700', color: '#5D6D7E' },
  filterTextActive: {
    color: '#000',
  },
  content: { padding: 16, paddingBottom: 80 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 64 },
  emptyDisc: { width: 96, height: 96, borderRadius: 48, backgroundColor: '#FFF3C4', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyTitle: { fontFamily: FONT_DISPLAY, fontSize: 20, fontWeight: '800', color: theme.colors.onyx, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#95A5A6', textAlign: 'center' },
});
