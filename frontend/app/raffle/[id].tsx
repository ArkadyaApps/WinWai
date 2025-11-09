import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import api from '../../src/utils/api';
import { Raffle } from '../../src/types';
import { useUserStore } from '../../src/store/userStore';

export default function RaffleDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user, updateTickets } = useUserStore();
  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [loading, setLoading] = useState(true);
  const [entering, setEntering] = useState(false);

  useEffect(() => {
    loadRaffle();
  }, [id]);

  const loadRaffle = async () => {
    try {
      const response = await api.get(`/api/raffles/${id}`);
      setRaffle(response.data);
    } catch (error) {
      console.error('Failed to load raffle:', error);
      Alert.alert('Error', 'Failed to load raffle details');
    } finally {
      setLoading(false);
    }
  };

  const handleEnter = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to enter raffles');
      return;
    }

    if (!raffle) return;

    if (user.tickets < raffle.ticketCost) {
      Alert.alert('Insufficient Tickets', `You need ${raffle.ticketCost} tickets to enter this raffle. You have ${user.tickets} tickets.`);
      return;
    }

    Alert.alert(
      'Enter Raffle',
      `Use ${raffle.ticketCost} tickets to enter this raffle?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Enter',
          onPress: async () => {
            setEntering(true);
            try {
              const response = await api.post('/api/raffles/enter', {
                raffleId: raffle.id,
                ticketsToUse: raffle.ticketCost,
              });
              updateTickets(response.data.newBalance);
              Alert.alert('Success!', 'You have entered the raffle. Good luck!');
              loadRaffle(); // Reload to get updated entry count
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.detail || 'Failed to enter raffle');
            } finally {
              setEntering(false);
            }
          },
        },
      ]
    );
  };

  const getCategoryGradient = (category: string): [string, string] => {
    switch (category) {
      case 'food': return ['#FF6B6B', '#FF8E53'];
      case 'hotel': return ['#4ECDC4', '#44A08D'];
      case 'spa': return ['#A8E6CF', '#88D8B0'];
      default: return ['#FFD700', '#FFC200'];
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }

  if (!raffle) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Raffle not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const gradientColors = getCategoryGradient(raffle.category);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          {raffle.image ? (
            <>
              <Image source={{ uri: raffle.image }} style={styles.heroImage} />
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.7)']}
                style={styles.heroGradient}
              />
            </>
          ) : (
            <LinearGradient colors={gradientColors} style={styles.heroPlaceholder}>
              <Ionicons name="gift" size={80} color="#fff" />
            </LinearGradient>
          )}

          {/* Back Button */}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <View style={styles.backBtnCircle}>
              <Ionicons name="arrow-back" size={24} color="#000" />
            </View>
          </TouchableOpacity>

          {/* Category Badge */}
          <LinearGradient
            colors={gradientColors}
            style={styles.categoryBadge}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.categoryText}>{raffle.category.toUpperCase()}</Text>
          </LinearGradient>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Title */}
          <Text style={styles.title}>{raffle.title}</Text>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="gift" size={20} color="#FF6B6B" />
              <View>
                <Text style={styles.statValue}>{raffle.prizesRemaining}</Text>
                <Text style={styles.statLabel}>Prizes Left</Text>
              </View>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Ionicons name="people" size={20} color="#4ECDC4" />
              <View>
                <Text style={styles.statValue}>{raffle.totalEntries}</Text>
                <Text style={styles.statLabel}>Total Entries</Text>
              </View>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Ionicons name="calendar" size={20} color="#A8E6CF" />
              <View>
                <Text style={styles.statValue}>{format(new Date(raffle.drawDate), 'MMM dd')}</Text>
                <Text style={styles.statLabel}>Draw Date</Text>
              </View>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About This Prize</Text>
            <Text style={styles.description}>{raffle.description}</Text>
          </View>

          {/* Partner Info */}
          {raffle.partnerName && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Partner</Text>
              <View style={styles.partnerCard}>
                <Ionicons name="business" size={24} color="#FFD700" />
                <Text style={styles.partnerName}>{raffle.partnerName}</Text>
              </View>
            </View>
          )}

          {/* Draw Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Draw Details</Text>
            <View style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={20} color="#7F8C8D" />
                <Text style={styles.detailLabel}>Draw Date:</Text>
                <Text style={styles.detailValue}>
                  {format(new Date(raffle.drawDate), 'MMMM dd, yyyy')}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="ticket-outline" size={20} color="#7F8C8D" />
                <Text style={styles.detailLabel}>Entry Cost:</Text>
                <Text style={styles.detailValue}>{raffle.ticketCost} tickets</Text>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="trophy-outline" size={20} color="#7F8C8D" />
                <Text style={styles.detailLabel}>Total Prizes:</Text>
                <Text style={styles.detailValue}>{raffle.prizesAvailable}</Text>
              </View>
            </View>
          </View>

          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.priceInfo}>
          <Text style={styles.priceLabel}>Entry Cost</Text>
          <View style={styles.priceRow}>
            <Ionicons name="ticket" size={20} color="#FFD700" />
            <Text style={styles.priceValue}>{raffle.ticketCost}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.enterButton, entering && styles.enterButtonDisabled]}
          onPress={handleEnter}
          disabled={entering || !raffle.active || raffle.prizesRemaining <= 0}
        >
          <LinearGradient
            colors={['#FFD700', '#FFC200']}
            style={styles.enterGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {entering ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <Text style={styles.enterText}>Enter Raffle</Text>
                <Ionicons name="arrow-forward" size={20} color="#000" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  scrollView: {
    flex: 1,
  },
  heroContainer: {
    width: '100%',
    height: 350,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  heroPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 16,
  },
  backBtnCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  categoryBadge: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  categoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#2C3E50',
    marginBottom: 20,
    lineHeight: 36,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E8E8E8',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2C3E50',
  },
  statLabel: {
    fontSize: 11,
    color: '#7F8C8D',
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#2C3E50',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: '#555',
  },
  partnerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  partnerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2C3E50',
  },
  detailsCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    flex: 1,
    fontSize: 14,
    color: '#7F8C8D',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 14,
    color: '#2C3E50',
    fontWeight: '700',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    gap: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  priceInfo: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    fontWeight: '600',
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#000',
  },
  enterButton: {
    flex: 2,
    borderRadius: 16,
    overflow: 'hidden',
  },
  enterButtonDisabled: {
    opacity: 0.5,
  },
  enterGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  enterText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#000',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
});