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
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import api from '../../src/utils/api';
import { Raffle, Partner } from '../../src/types';
import { useUserStore } from '../../src/store/userStore';

export default function RaffleDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user, updateTickets } = useUserStore();
  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [entering, setEntering] = useState(false);

  useEffect(() => {
    loadRaffle();
  }, [id]);

  const loadRaffle = async () => {
    try {
      const response = await api.get(`/api/raffles/${id}`);
      setRaffle(response.data);
      
      // Load partner details if partnerId exists
      if (response.data.partnerId) {
        try {
          const partnerResponse = await api.get(`/api/partners/${response.data.partnerId}`);
          setPartner(partnerResponse.data);
        } catch (partnerError) {
          console.error('Failed to load partner:', partnerError);
          // Don't show error - partner details are optional
        }
      }
    } catch (error) {
      console.error('Failed to load raffle:', error);
      Alert.alert('Error', 'Failed to load raffle details');
    } finally {
      setLoading(false);
    }
  };

  const openMap = () => {
    if (partner && partner.latitude && partner.longitude) {
      const url = Platform.select({
        ios: `maps:0,0?q=${partner.name}@${partner.latitude},${partner.longitude}`,
        android: `geo:${partner.latitude},${partner.longitude}?q=${partner.name}`,
      });
      if (url) {
        Linking.openURL(url).catch(() => {
          Alert.alert('Error', 'Could not open maps');
        });
      }
    } else if (partner && partner.address) {
      const url = Platform.select({
        ios: `maps:0,0?q=${encodeURIComponent(partner.address)}`,
        android: `geo:0,0?q=${encodeURIComponent(partner.address)}`,
      });
      if (url) {
        Linking.openURL(url).catch(() => {
          Alert.alert('Error', 'Could not open maps');
        });
      }
    }
  };

  const openWhatsApp = () => {
    if (partner && partner.whatsapp) {
      const url = `whatsapp://send?phone=${partner.whatsapp}`;
      Linking.openURL(url).catch(() => {
        Alert.alert('Error', 'WhatsApp is not installed');
      });
    }
  };

  const openLine = () => {
    if (partner && partner.line) {
      const url = `https://line.me/R/ti/p/${partner.line}`;
      Linking.openURL(url).catch(() => {
        Alert.alert('Error', 'LINE is not installed');
      });
    }
  };

  const openEmail = () => {
    if (partner && partner.email) {
      const url = `mailto:${partner.email}`;
      Linking.openURL(url).catch(() => {
        Alert.alert('Error', 'Could not open email');
      });
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
          {partner && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Partner Information</Text>
              
              {/* Partner Header */}
              <View style={styles.partnerHeader}>
                {partner.logo || partner.photo ? (
                  <Image 
                    source={{ uri: partner.logo || partner.photo }} 
                    style={styles.partnerLogo} 
                  />
                ) : (
                  <View style={styles.partnerLogoPlaceholder}>
                    <Ionicons name="business" size={32} color="#FFD700" />
                  </View>
                )}
                <View style={styles.partnerHeaderText}>
                  <Text style={styles.partnerName}>{partner.name}</Text>
                  {partner.category && (
                    <Text style={styles.partnerCategory}>{partner.category.toUpperCase()}</Text>
                  )}
                </View>
              </View>

              {/* Partner Description */}
              {partner.description && (
                <Text style={styles.partnerDescription}>{partner.description}</Text>
              )}

              {/* Contact Methods */}
              <View style={styles.contactMethodsContainer}>
                {/* Location/Map */}
                {(partner.address || (partner.latitude && partner.longitude)) && (
                  <TouchableOpacity style={styles.contactButton} onPress={openMap}>
                    <View style={styles.contactButtonContent}>
                      <Ionicons name="location" size={24} color="#FF6B6B" />
                      <View style={styles.contactButtonText}>
                        <Text style={styles.contactButtonLabel}>Location</Text>
                        {partner.address && (
                          <Text style={styles.contactButtonValue} numberOfLines={2}>
                            {partner.address}
                          </Text>
                        )}
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                  </TouchableOpacity>
                )}

                {/* WhatsApp */}
                {partner.whatsapp && (
                  <TouchableOpacity style={styles.contactButton} onPress={openWhatsApp}>
                    <View style={styles.contactButtonContent}>
                      <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
                      <View style={styles.contactButtonText}>
                        <Text style={styles.contactButtonLabel}>WhatsApp</Text>
                        <Text style={styles.contactButtonValue}>{partner.whatsapp}</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                  </TouchableOpacity>
                )}

                {/* LINE */}
                {partner.line && (
                  <TouchableOpacity style={styles.contactButton} onPress={openLine}>
                    <View style={styles.contactButtonContent}>
                      <View style={styles.lineIconContainer}>
                        <Text style={styles.lineIcon}>L</Text>
                      </View>
                      <View style={styles.contactButtonText}>
                        <Text style={styles.contactButtonLabel}>LINE</Text>
                        <Text style={styles.contactButtonValue}>@{partner.line}</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                  </TouchableOpacity>
                )}

                {/* Email */}
                {partner.email && (
                  <TouchableOpacity style={styles.contactButton} onPress={openEmail}>
                    <View style={styles.contactButtonContent}>
                      <Ionicons name="mail" size={24} color="#4ECDC4" />
                      <View style={styles.contactButtonText}>
                        <Text style={styles.contactButtonLabel}>Email</Text>
                        <Text style={styles.contactButtonValue}>{partner.email}</Text>
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                  </TouchableOpacity>
                )}
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
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    gap: 12,
  },
  partnerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  partnerLogo: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 12,
  },
  partnerLogoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#FFF8E7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  partnerHeaderText: {
    flex: 1,
  },
  partnerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  partnerCategory: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFD700',
    letterSpacing: 1,
  },
  partnerDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  contactMethodsContainer: {
    gap: 12,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  contactButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  contactButtonText: {
    marginLeft: 12,
    flex: 1,
  },
  contactButtonLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  contactButtonValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  lineIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#00B900',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lineIcon: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
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