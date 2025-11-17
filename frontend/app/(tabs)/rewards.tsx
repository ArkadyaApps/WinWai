import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Voucher } from '../../src/types';
import api from '../../src/utils/api';
import BannerAdComponent from '../../src/components/BannerAd';
import VoucherCard from '../../src/components/VoucherCard';
import AppHeader from '../../src/components/AppHeader';
import { theme } from '../../src/theme/tokens';
import { isPast } from 'date-fns';
import { useTranslation } from '../../src/i18n/useTranslation';

const LOGO_URI = 'https://customer-assets.emergentagent.com/job_raffle-rewards-1/artifacts/tsv1bcjh_logo.png';

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
      setVouchers(response.data); 
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
    <View style={styles.container}>
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
            <Text style={styles.emptyIcon}>🎟️</Text>
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
          filteredVouchers.map((voucher) => (
            <VoucherCard 
              key={voucher.id} 
              voucher={voucher} 
              onPress={() => handleVoucherPress(voucher)}
            />
          ))
        )}
      </ScrollView>
      <BannerAdComponent position="bottom" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.cloud },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filterContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterScroll: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  filterTabActive: {
    backgroundColor: theme.colors.primaryGold,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterTextActive: {
    color: '#000',
  },
  content: { padding: 16, paddingBottom: 80 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 64 },
  emptyIcon: { fontSize: 72, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: theme.colors.onyx, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#95A5A6', textAlign: 'center' },
});
