import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Clipboard,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format, isPast } from 'date-fns';
import api from '../../src/utils/api';
import { Voucher } from '../../src/types';
import { theme } from '../../src/theme/tokens';

export default function VoucherDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVoucher();
  }, [id]);

  const loadVoucher = async () => {
    try {
      const response = await api.get('/api/vouchers');
      const vouchers: Voucher[] = response.data;
      const found = vouchers.find(v => v.id === id);
      if (found) {
        setVoucher(found);
      } else {
        Alert.alert('Error', 'Voucher not found');
        router.back();
      }
    } catch (error) {
      console.error('Failed to load voucher:', error);
      Alert.alert('Error', 'Failed to load voucher details');
    } finally {
      setLoading(false);
    }
  };

  const copyVoucherCode = () => {
    if (voucher) {
      Clipboard.setString(voucher.voucherCode);
      Alert.alert('Copied!', 'Voucher code copied to clipboard');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primaryGold} />
      </View>
    );
  }

  if (!voucher) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Voucher not found</Text>
      </View>
    );
  }

  const expiryDate = new Date(voucher.expiresAt);
  const isExpired = isPast(expiryDate);
  const isRedeemed = voucher.isRedeemed;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Voucher Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Status Badge */}
        <View style={styles.statusContainer}>
          {isRedeemed ? (
            <View style={[styles.statusBadge, { backgroundColor: '#999' }]}>
              <Ionicons name="checkmark-done-circle" size={20} color="#fff" />
              <Text style={styles.statusText}>Redeemed</Text>
            </View>
          ) : isExpired ? (
            <View style={[styles.statusBadge, { backgroundColor: '#ff4444' }]}>
              <Ionicons name="close-circle" size={20} color="#fff" />
              <Text style={styles.statusText}>Expired</Text>
            </View>
          ) : (
            <View style={[styles.statusBadge, { backgroundColor: theme.colors.emeraldA }]}>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.statusText}>Active</Text>
            </View>
          )}
        </View>

        {/* Prize Info */}
        <View style={styles.section}>
          <Text style={styles.label}>Prize</Text>
          <Text style={styles.title}>{voucher.raffleTitle}</Text>
          <Text style={styles.subtitle}>{voucher.prizeDetails}</Text>
        </View>

        {/* Voucher Code */}
        <View style={styles.section}>
          <Text style={styles.label}>Voucher Code</Text>
          <TouchableOpacity style={styles.codeBox} onPress={copyVoucherCode}>
            <Text style={styles.codeText}>{voucher.voucherCode}</Text>
            <Ionicons name="copy-outline" size={24} color={theme.colors.primaryGold} />
          </TouchableOpacity>
          <Text style={styles.helperText}>Tap to copy code</Text>
        </View>

        {/* Partner Info */}
        <View style={styles.section}>
          <Text style={styles.label}>Partner</Text>
          <Text style={styles.value}>{voucher.partnerName}</Text>
          {voucher.location && (
            <View style={styles.infoRow}>
              <Ionicons name="location" size={16} color="#999" />
              <Text style={styles.infoText}>{voucher.location}</Text>
            </View>
          )}
          {voucher.address && (
            <Text style={styles.addressText}>{voucher.address}</Text>
          )}
        </View>

        {/* Validity Info */}
        <View style={styles.section}>
          <Text style={styles.label}>Validity</Text>
          <View style={styles.infoRow}>
            <Ionicons name="calendar" size={16} color="#999" />
            <Text style={styles.infoText}>
              Issued: {format(new Date(voucher.issuedAt), 'MMM dd, yyyy')}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={16} color={isExpired ? '#ff4444' : '#999'} />
            <Text style={[styles.infoText, isExpired && { color: '#ff4444' }]}>
              Expires: {format(expiryDate, 'MMM dd, yyyy')}
            </Text>
          </View>
          {isRedeemed && voucher.redeemedAt && (
            <View style={styles.infoRow}>
              <Ionicons name="checkmark-done" size={16} color="#999" />
              <Text style={styles.infoText}>
                Redeemed: {format(new Date(voucher.redeemedAt), 'MMM dd, yyyy')}
              </Text>
            </View>
          )}
        </View>

        {/* Terms */}
        {voucher.terms && (
          <View style={styles.section}>
            <Text style={styles.label}>Terms & Conditions</Text>
            <Text style={styles.termsText}>{voucher.terms}</Text>
          </View>
        )}

        {/* Instructions */}
        {!isRedeemed && !isExpired && (
          <View style={styles.instructionsBox}>
            <Ionicons name="information-circle" size={24} color={theme.colors.primaryGold} />
            <View style={styles.instructionsText}>
              <Text style={styles.instructionsTitle}>How to Use</Text>
              <Text style={styles.instructionsBody}>
                Present this voucher code at {voucher.partnerName} to redeem your prize.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.cloud,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#999',
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF8E7',
    borderRadius: 8,
    padding: 16,
    borderWidth: 2,
    borderColor: theme.colors.primaryGold,
    borderStyle: 'dashed',
  },
  codeText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 3,
    fontFamily: 'monospace',
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    lineHeight: 20,
  },
  termsText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  instructionsBox: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#FFF8E7',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.primaryGold,
  },
  instructionsText: {
    flex: 1,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  instructionsBody: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
