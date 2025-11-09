import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../src/utils/api';
import { Raffle } from '../../src/types';
import { LinearGradient } from 'expo-linear-gradient';

export default function AdminRafflesScreen() {
  const router = useRouter();
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRaffles();
  }, []);

  const fetchRaffles = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/raffles');
      setRaffles(response.data);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to fetch raffles');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (raffle: Raffle) => {
    Alert.alert(
      'Delete Raffle',
      `Are you sure you want to delete "${raffle.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/api/admin/raffles/${raffle.id}`);
              Alert.alert('Success', 'Raffle deleted successfully');
              fetchRaffles();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.detail || 'Failed to delete raffle');
            }
          },
        },
      ]
    );
  };

  const handleDrawWinner = (raffle: Raffle) => {
    Alert.alert(
      'Draw Winner',
      `Draw a winner for "${raffle.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Draw Winner',
          onPress: async () => {
            try {
              const response = await api.post('/api/admin/draw-winner', {
                raffleId: raffle.id,
              });
              Alert.alert('Success', response.data.message);
              fetchRaffles();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.detail || 'Failed to draw winner');
            }
          },
        },
      ]
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'food': return '🍽️';
      case 'hotel': return '🏨';
      case 'spa': return '💆';
      default: return '🎁';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#A8E6CF', '#88D8B0']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Raffles</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        {raffles.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="gift-outline" size={64} color="#999" />
            <Text style={styles.emptyText}>No raffles yet</Text>
          </View>
        ) : (
          raffles.map((raffle) => (
            <View key={raffle.id} style={styles.raffleCard}>
              <View style={styles.raffleHeader}>
                <Text style={styles.categoryIcon}>{getCategoryIcon(raffle.category)}</Text>
                <View style={styles.raffleInfo}>
                  <Text style={styles.raffleTitle}>{raffle.title}</Text>
                  <Text style={styles.rafflePartner}>{raffle.partnerName}</Text>
                  <Text style={styles.raffleLocation}>📍 {raffle.location}</Text>
                </View>
                {raffle.active ? (
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeText}>ACTIVE</Text>
                  </View>
                ) : (
                  <View style={styles.inactiveBadge}>
                    <Text style={styles.inactiveText}>CLOSED</Text>
                  </View>
                )}
              </View>

              <View style={styles.raffleStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Prizes</Text>
                  <Text style={styles.statValue}>
                    {raffle.prizesRemaining}/{raffle.prizesAvailable}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Entries</Text>
                  <Text style={styles.statValue}>{raffle.totalEntries}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Draw Date</Text>
                  <Text style={styles.statValue}>{formatDate(raffle.drawDate)}</Text>
                </View>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={styles.drawButton}
                  onPress={() => handleDrawWinner(raffle)}
                  disabled={!raffle.active || raffle.totalEntries === 0}
                >
                  <Ionicons name="trophy-outline" size={20} color="#fff" />
                  <Text style={styles.drawButtonText}>Draw Winner</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(raffle)}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  content: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  raffleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  raffleHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  categoryIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  raffleInfo: {
    flex: 1,
  },
  raffleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2C3E50',
    marginBottom: 4,
  },
  rafflePartner: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 2,
  },
  raffleLocation: {
    fontSize: 13,
    color: '#7F8C8D',
    textTransform: 'capitalize',
  },
  activeBadge: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    height: 24,
  },
  activeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  inactiveBadge: {
    backgroundColor: '#E0E0E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    height: 24,
  },
  inactiveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#999',
  },
  raffleStats: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2C3E50',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  drawButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#A8E6CF',
    padding: 12,
    borderRadius: 8,
  },
  drawButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  deleteButton: {
    backgroundColor: '#FFEAEA',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    width: 48,
  },
});
