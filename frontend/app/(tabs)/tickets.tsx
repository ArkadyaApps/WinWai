import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useUserStore } from '../../src/store/userStore';
import { rewardedAdManager } from '../../src/managers/RewardedAdManager';
import api from '../../src/utils/api';
import BannerAdComponent from '../../src/components/BannerAd';

export default function TicketsScreen() {
  const { user, updateTickets } = useUserStore();
  const [adReady, setAdReady] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      rewardedAdManager.loadRewardedAd(user.id);
      rewardedAdManager.setRewardCallback(async (reward) => {
        // Refresh ticket balance
        try {
          const response = await api.get('/api/users/me/tickets');
          updateTickets(response.data.tickets);
        } catch (error) {
          console.error('Failed to refresh tickets:', error);
        }
      });
    }

    const interval = setInterval(() => {
      setAdReady(rewardedAdManager.isRewardedAdReady());
    }, 1000);

    return () => clearInterval(interval);
  }, [user]);

  const handleWatchAd = async () => {
    setLoading(true);
    try {
      await rewardedAdManager.showRewardedAd();
    } catch (error) {
      console.error('Failed to show ad:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Your Ticket Balance</Text>
          <View style={styles.balanceRow}>
            <Text style={styles.balanceIcon}>🎟️</Text>
            <Text style={styles.balanceAmount}>{user?.tickets || 0}</Text>
          </View>
          <Text style={styles.balanceSubtext}>tickets available</Text>
        </View>

        <View style={styles.earnSection}>
          <Text style={styles.sectionTitle}>Earn More Tickets</Text>
          
          <TouchableOpacity
            style={[
              styles.playButton,
              (!adReady || loading) && styles.playButtonDisabled,
            ]}
            onPress={handleWatchAd}
            disabled={!adReady || loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <View style={styles.playButtonContent}>
                <ActivityIndicator color="#ffffff" size="large" />
                <Text style={styles.playButtonTextLoading}>Loading...</Text>
              </View>
            ) : (
              <View style={styles.playButtonContent}>
                <View style={styles.playIconContainer}>
                  <Text style={styles.playIcon}>▶</Text>
                </View>
                <View style={styles.playButtonTextContainer}>
                  <Text style={styles.playButtonTitle}>
                    {adReady ? '🎬 Play Rewarded Ad' : '⏳ Loading Ad...'}
                  </Text>
                  <Text style={styles.playButtonSubtitle}>
                    Earn +10 tickets instantly
                  </Text>
                </View>
              </View>
            )}
          </TouchableOpacity>

          {!adReady && (
            <Text style={styles.adStatusText}>
              📱 Note: Ads only work on mobile devices (iOS/Android). Use Expo Go or production build.
            </Text>
          )}

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>How to Earn Tickets</Text>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>🎥</Text>
              <Text style={styles.infoText}>Watch rewarded ads (+10 tickets)</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>🎁</Text>
              <Text style={styles.infoText}>Daily login bonus (+5 tickets)</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoBullet}>👥</Text>
              <Text style={styles.infoText}>Refer friends (+20 tickets)</Text>
            </View>
          </View>
        </View>

        <View style={styles.usageSection}>
          <Text style={styles.sectionTitle}>Ticket Usage</Text>
          <Text style={styles.usageText}>
            Use your tickets to enter raffles and win amazing prizes! Each raffle entry typically costs 10 tickets.
          </Text>
        </View>
      </ScrollView>
      
      <BannerAdComponent position="bottom" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 16,
    paddingBottom: 80,
  },
  balanceCard: {
    backgroundColor: '#FFD700',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#000',
    fontWeight: '600',
    marginBottom: 12,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  balanceIcon: {
    fontSize: 48,
  },
  balanceAmount: {
    fontSize: 64,
    fontWeight: '800',
    color: '#000',
  },
  balanceSubtext: {
    fontSize: 14,
    color: '#666',
  },
  earnSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 16,
  },
  watchAdButton: {
    backgroundColor: '#4CAF50',
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  watchAdButtonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  watchAdIcon: {
    fontSize: 32,
  },
  watchAdText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  watchAdSubtext: {
    fontSize: 13,
    color: '#e0ffe0',
  },
  infoCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  infoBullet: {
    fontSize: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    flex: 1,
  },
  usageSection: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
  },
  usageText: {
    fontSize: 14,
    color: '#7F8C8D',
    lineHeight: 20,
  },
});