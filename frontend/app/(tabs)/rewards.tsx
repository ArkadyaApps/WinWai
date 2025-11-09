import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Reward } from '../../src/types';
import api from '../../src/utils/api';
import BannerAdComponent from '../../src/components/BannerAd';
import { format } from 'date-fns';

export default function RewardsScreen() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRewards();
  }, []);

  const loadRewards = async () => {
    try {
      const response = await api.get('/api/rewards/my-rewards');
      setRewards(response.data);
    } catch (error) {
      console.error('Failed to load rewards:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadRewards();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unclaimed': return '#FFD700';
      case 'pending': return '#FF9800';
      case 'claimed': return '#4CAF50';
      default: return '#999';
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {rewards.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🏆</Text>
            <Text style={styles.emptyTitle}>No Rewards Yet</Text>
            <Text style={styles.emptyText}>
              Enter raffles to win amazing prizes!
            </Text>
          </View>
        ) : (
          rewards.map((reward) => (
            <View key={reward.id} style={styles.rewardCard}>
              <View style={styles.rewardHeader}>
                <Text style={styles.rewardTitle}>{reward.raffleTitle}</Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(reward.claimStatus) },
                  ]}
                >
                  <Text style={styles.statusText}>
                    {reward.claimStatus.toUpperCase()}
                  </Text>
                </View>
              </View>

              <Text style={styles.rewardPartner}>{reward.partnerName}</Text>
              <Text style={styles.rewardDetails}>{reward.prizeDetails}</Text>

              <View style={styles.rewardFooter}>
                <Text style={styles.rewardDate}>
                  Won on {format(new Date(reward.wonAt), 'MMM dd, yyyy')}
                </Text>
                {reward.claimStatus === 'unclaimed' && (
                  <TouchableOpacity
                    style={styles.claimButton}
                    onPress={() => {/* Open claim modal */}}
                  >
                    <Text style={styles.claimButtonText}>Claim Prize</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
    paddingBottom: 80,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyIcon: {
    fontSize: 72,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#95A5A6',
    textAlign: 'center',
  },
  rewardCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rewardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2C3E50',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  rewardPartner: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 8,
  },
  rewardDetails: {
    fontSize: 14,
    color: '#555',
    marginBottom: 12,
  },
  rewardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  rewardDate: {
    fontSize: 12,
    color: '#95A5A6',
  },
  claimButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  claimButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000',
  },
});