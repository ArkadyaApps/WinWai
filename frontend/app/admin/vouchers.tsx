import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import api from '../../src/utils/api';
import AppHeader from '../../src/components/AppHeader';
import { theme } from '../../src/theme/tokens';

interface AdminVoucher {
  id: string;
  voucherRef: string;
  raffleTitle: string;
  partnerName: string;
  prizeValue: number;
  currency: string;
  isDigitalPrize: boolean;
  winnerName: string;
  status: 'active' | 'redeemed' | 'expired' | 'cancelled';
  validUntil: string;
  redeemedAt?: string | null;
}

const STATUS_COLORS: Record<AdminVoucher['status'], string> = {
  active: '#4ECDC4',
  redeemed: '#999',
  expired: '#FF6B6B',
  cancelled: '#999',
};

// Admin at the counter: type the code a winner shows, check what it's for and
// whether it is still valid, then mark it redeemed.
export default function AdminVouchersScreen() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [voucher, setVoucher] = useState<AdminVoucher | null>(null);
  const [looking, setLooking] = useState(false);
  const [redeeming, setRedeeming] = useState(false);

  const errorMessage = (error: any, fallback: string) => error.response?.data?.error || error.response?.data?.detail || fallback;

  const lookUp = async () => {
    if (code.trim().length < 4) return;
    setLooking(true);
    setVoucher(null);
    try {
      const response = await api.get('/api/admin/vouchers/lookup', { params: { code: code.trim() } });
      setVoucher(response.data);
    } catch (error: any) {
      Alert.alert('Voucher', errorMessage(error, 'Lookup failed'));
    } finally {
      setLooking(false);
    }
  };

  const redeem = () => {
    if (!voucher) return;
    Alert.alert('Redeem voucher', `Mark ${voucher.voucherRef} (${voucher.raffleTitle}) as redeemed? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Redeem',
        style: 'destructive',
        onPress: async () => {
          setRedeeming(true);
          try {
            const response = await api.post('/api/admin/vouchers/redeem', { voucherId: voucher.id });
            setVoucher(response.data.voucher);
            Alert.alert('Done', 'Voucher marked as redeemed');
          } catch (error: any) {
            Alert.alert('Could not redeem', errorMessage(error, 'Redeem failed'));
            lookUp();
          } finally {
            setRedeeming(false);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <AppHeader
        variant="gold"
        logoUri="/logo.png"
        onBack={() => router.back()}
        showDivider
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Redeem a voucher</Text>
        <Text style={styles.help}>Enter the code the winner shows in their Rewards tab (verification code or full reference).</Text>

        <View style={styles.row}>
          <TextInput
            style={styles.input}
            value={code}
            onChangeText={(v) => setCode(v.toUpperCase())}
            placeholder="e.g. 7K3Q9ZAB"
            placeholderTextColor="#999"
            autoCapitalize="characters"
            autoCorrect={false}
            onSubmitEditing={lookUp}
          />
          <TouchableOpacity style={[styles.button, code.trim().length < 4 && styles.buttonDisabled]} onPress={lookUp} disabled={looking || code.trim().length < 4}>
            {looking ? <ActivityIndicator color="#000" /> : <Text style={styles.buttonText}>Look up</Text>}
          </TouchableOpacity>
        </View>

        {voucher && (
          <View style={styles.card}>
            <View style={[styles.badge, { backgroundColor: STATUS_COLORS[voucher.status] }]}>
              <Text style={styles.badgeText}>{voucher.status.toUpperCase()}</Text>
            </View>
            <Text style={styles.prize}>{voucher.raffleTitle}</Text>
            <Text style={styles.line}>{voucher.partnerName}</Text>
            <Text style={styles.line}>
              {voucher.isDigitalPrize ? 'Digital prize' : `Value: ${voucher.prizeValue} ${voucher.currency}`}
            </Text>
            <View style={styles.divider} />
            <Text style={styles.line}>Winner: {voucher.winnerName}</Text>
            <Text style={styles.line}>Reference: {voucher.voucherRef}</Text>
            <Text style={styles.line}>Valid until: {format(new Date(voucher.validUntil), 'MMM dd, yyyy')}</Text>
            {voucher.redeemedAt ? <Text style={styles.line}>Redeemed: {format(new Date(voucher.redeemedAt), 'MMM dd, yyyy HH:mm')}</Text> : null}

            {voucher.status === 'active' && (
              <TouchableOpacity style={styles.redeemButton} onPress={redeem} disabled={redeeming}>
                {redeeming ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-done" size={20} color="#fff" />
                    <Text style={styles.redeemText}>Mark as redeemed</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.cloud },
  content: { padding: 20 },
  title: { fontSize: 22, fontWeight: '800', color: theme.colors.onyx, marginBottom: 6 },
  help: { fontSize: 14, color: theme.colors.slate, marginBottom: 16, lineHeight: 20 },
  row: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 14, fontSize: 18, letterSpacing: 2, fontWeight: '700', color: theme.colors.onyx },
  button: { backgroundColor: theme.colors.primaryGold, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 12 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { fontSize: 16, fontWeight: '700', color: '#000' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginTop: 20 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginBottom: 10 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  prize: { fontSize: 20, fontWeight: '800', color: theme.colors.onyx, marginBottom: 4 },
  line: { fontSize: 14, color: '#555', marginTop: 4 },
  divider: { height: 1, backgroundColor: '#eee', marginVertical: 12 },
  redeemButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#0F8B6D', padding: 16, borderRadius: 12, marginTop: 18 },
  redeemText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
