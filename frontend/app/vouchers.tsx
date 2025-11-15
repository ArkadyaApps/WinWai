import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../src/utils/api';
import AppHeader from '../src/components/AppHeader';
import { theme } from '../src/theme/tokens';
import { LinearGradient } from 'expo-linear-gradient';

interface Voucher {
  id: string;
  voucherRef: string;
  raffleTitle: string;
  partnerName: string;
  prizeValue: number;
  currency: string;
  isDigitalPrize: boolean;
  secretCode?: string;
  verificationCode: string;
  status: string;
  validUntil: string;
  createdAt: string;
  partnerEmail?: string;
  partnerWhatsapp?: string;
  partnerLine?: string;
  partnerAddress?: string;
}

export default function VouchersScreen() {
  const router = useRouter();
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedVoucher, setExpandedVoucher] = useState<string | null>(null);

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/users/me/vouchers');
      setVouchers(response.data);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to fetch vouchers');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchVouchers();
    } finally {
      setRefreshing(false);
    }
  };

  const toggleVoucherExpand = (voucherId: string) => {
    setExpandedVoucher(expandedVoucher === voucherId ? null : voucherId);
  };

  const copyToClipboard = (text: string, label: string) => {
    // Note: Clipboard API requires expo-clipboard
    Alert.alert('Copied', `${label} copied!`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isExpired = (validUntil: string) => {
    return new Date(validUntil) < new Date();
  };

  const getStatusColor = (status: string, validUntil: string) => {
    if (isExpired(validUntil)) return '#999';
    if (status === 'redeemed') return '#4CAF50';
    return theme.colors.primaryGold;
  };

  const getStatusText = (status: string, validUntil: string) => {
    if (isExpired(validUntil)) return 'EXPIRED';
    if (status === 'redeemed') return 'REDEEMED';
    return 'ACTIVE';
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={theme.colors.primaryGold} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader 
        variant="gold" 
        logoUri="https://customer-assets.emergentagent.com/job_raffle-rewards-1/artifacts/tsv1bcjh_logo.png" 
        onBack={() => router.back()} 
        showDivider 
      />

      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Ionicons name="trophy" size={32} color={theme.colors.primaryGold} />
          <Text style={styles.headerTitle}>My Vouchers</Text>
          <Text style={styles.headerSubtitle}>
            {vouchers.length} {vouchers.length === 1 ? 'voucher' : 'vouchers'} won
          </Text>
        </View>

        {vouchers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="ticket-outline" size={64} color="#999" />
            <Text style={styles.emptyTitle}>No Vouchers Yet</Text>
            <Text style={styles.emptyText}>
              Enter raffles and win prizes to see your vouchers here!
            </Text>
          </View>
        ) : (
          vouchers.map((voucher) => {
            const isExpiredVoucher = isExpired(voucher.validUntil);
            const expanded = expandedVoucher === voucher.id;

            return (
              <View key={voucher.id} style={styles.voucherCard}>
                <LinearGradient
                  colors={
                    isExpiredVoucher
                      ? ['#999', '#777']
                      : voucher.status === 'redeemed'
                      ? ['#4CAF50', '#45A049']
                      : ['#FFD700', '#FFA500']
                  }
                  style={styles.voucherGradient}
                >
                  {/* Status Badge */}
                  <View 
                    style={[
                      styles.statusBadge, 
                      { backgroundColor: getStatusColor(voucher.status, voucher.validUntil) }
                    ]}
                  >
                    <Text style={styles.statusText}>
                      {getStatusText(voucher.status, voucher.validUntil)}
                    </Text>
                  </View>

                  {/* Voucher Header */}
                  <View style={styles.voucherHeader}>
                    <View style={styles.voucherIcon}>
                      <Ionicons 
                        name={voucher.isDigitalPrize ? "code-slash" : "gift"} 
                        size={32} 
                        color="#fff" 
                      />
                    </View>
                    <View style={styles.voucherHeaderText}>
                      <Text style={styles.voucherRef}>{voucher.voucherRef}</Text>
                      <Text style={styles.voucherTitle} numberOfLines={2}>
                        {voucher.raffleTitle}
                      </Text>
                      <Text style={styles.voucherPartner}>{voucher.partnerName}</Text>
                    </View>
                  </View>

                  {/* Prize Value */}
                  <View style={styles.prizeValueBox}>
                    <Text style={styles.prizeValueLabel}>Prize Value</Text>
                    <Text style={styles.prizeValue}>
                      {voucher.prizeValue} {voucher.currency}
                    </Text>
                  </View>

                  {/* Expand/Collapse Button */}
                  <TouchableOpacity 
                    style={styles.expandButton}
                    onPress={() => toggleVoucherExpand(voucher.id)}
                  >
                    <Text style={styles.expandButtonText}>
                      {expanded ? 'Hide Details' : 'View Details'}
                    </Text>
                    <Ionicons 
                      name={expanded ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color="#fff" 
                    />
                  </TouchableOpacity>
                </LinearGradient>

                {/* Expanded Details */}
                {expanded && (
                  <View style={styles.detailsContainer}>
                    {/* Digital Prize Code */}
                    {voucher.isDigitalPrize && voucher.secretCode && (
                      <View style={styles.codeBox}>
                        <View style={styles.codeHeader}>
                          <Ionicons name="key" size={20} color={theme.colors.primaryGold} />
                          <Text style={styles.codeLabel}>Secret Code</Text>
                        </View>
                        <View style={styles.codeValueContainer}>
                          <Text style={styles.codeValue} selectable>
                            {voucher.secretCode}
                          </Text>
                          <TouchableOpacity 
                            onPress={() => copyToClipboard(voucher.secretCode!, 'Secret code')}
                          >
                            <Ionicons name="copy-outline" size={20} color={theme.colors.primaryGold} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}

                    {/* Verification Code */}
                    <View style={styles.codeBox}>
                      <View style={styles.codeHeader}>
                        <Ionicons name="shield-checkmark" size={20} color={theme.colors.emeraldA} />
                        <Text style={styles.codeLabel}>Verification Code</Text>
                      </View>
                      <View style={styles.codeValueContainer}>
                        <Text style={styles.codeValue} selectable>
                          {voucher.verificationCode}
                        </Text>
                        <TouchableOpacity 
                          onPress={() => copyToClipboard(voucher.verificationCode, 'Verification code')}
                        >
                          <Ionicons name="copy-outline" size={20} color={theme.colors.emeraldA} />
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.codeHint}>
                        Present this code to the partner to redeem your prize
                      </Text>
                    </View>

                    {/* Partner Contact Info */}
                    {(voucher.partnerEmail || voucher.partnerWhatsapp || voucher.partnerLine || voucher.partnerAddress) && (
                      <View style={styles.contactBox}>
                        <Text style={styles.contactTitle}>Partner Contact</Text>
                        {voucher.partnerEmail && (
                          <View style={styles.contactItem}>
                            <Ionicons name="mail" size={18} color={theme.colors.onyx} />
                            <Text style={styles.contactText}>{voucher.partnerEmail}</Text>
                          </View>
                        )}
                        {voucher.partnerWhatsapp && (
                          <View style={styles.contactItem}>
                            <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
                            <Text style={styles.contactText}>{voucher.partnerWhatsapp}</Text>
                          </View>
                        )}
                        {voucher.partnerLine && (
                          <View style={styles.contactItem}>
                            <Ionicons name="chatbubble" size={18} color="#00B900" />
                            <Text style={styles.contactText}>LINE: {voucher.partnerLine}</Text>
                          </View>
                        )}
                        {voucher.partnerAddress && (
                          <View style={styles.contactItem}>
                            <Ionicons name="location" size={18} color={theme.colors.onyx} />
                            <Text style={styles.contactText}>{voucher.partnerAddress}</Text>
                          </View>
                        )}
                      </View>
                    )}

                    {/* Validity Info */}
                    <View style={styles.validityBox}>
                      <View style={styles.validityItem}>
                        <Text style={styles.validityLabel}>Won On</Text>
                        <Text style={styles.validityValue}>{formatDate(voucher.createdAt)}</Text>
                      </View>
                      <View style={styles.validityItem}>
                        <Text style={styles.validityLabel}>Valid Until</Text>
                        <Text style={[
                          styles.validityValue,
                          isExpiredVoucher && { color: theme.colors.danger }
                        ]}>
                          {formatDate(voucher.validUntil)}
                        </Text>
                      </View>
                    </View>

                    {!voucher.isDigitalPrize && (
                      <View style={styles.redeemHint}>
                        <Ionicons name="information-circle" size={20} color={theme.colors.primaryGold} />
                        <Text style={styles.redeemHintText}>
                          Visit the partner location with your verification code to claim your prize
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}
        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.cloud,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.cloud,
  },
  content: {
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.onyx,
    marginTop: 12,
  },
  headerSubtitle: {
    fontSize: 16,
    color: theme.colors.slate,
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: theme.colors.onyx,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.slate,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  voucherCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  voucherGradient: {
    padding: 16,
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: theme.colors.primaryGold,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  voucherHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  voucherIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  voucherHeaderText: {
    flex: 1,
  },
  voucherRef: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
    opacity: 0.9,
  },
  voucherTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginTop: 4,
  },
  voucherPartner: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginTop: 2,
  },
  prizeValueBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  prizeValueLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
  },
  prizeValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginTop: 4,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  expandButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  detailsContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  codeBox: {
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  codeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  codeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onyx,
  },
  codeValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  codeValue: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.onyx,
    letterSpacing: 2,
  },
  codeHint: {
    fontSize: 12,
    color: theme.colors.slate,
    marginTop: 8,
    fontStyle: 'italic',
  },
  contactBox: {
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onyx,
    marginBottom: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  contactText: {
    fontSize: 14,
    color: theme.colors.onyx,
  },
  validityBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  validityItem: {
    flex: 1,
  },
  validityLabel: {
    fontSize: 12,
    color: theme.colors.slate,
    marginBottom: 4,
  },
  validityValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onyx,
  },
  redeemHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFF9E6',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  redeemHintText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.onyx,
    lineHeight: 18,
  },
});
