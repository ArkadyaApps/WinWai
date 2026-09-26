import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import WwIcon from './ui/WwIcon';
import { Voucher } from '../types';
import { theme } from '../theme/tokens';
import { format, isPast } from 'date-fns';

interface VoucherCardProps {
  voucher: Voucher;
  onPress: () => void;
}

export default function VoucherCard({ voucher, onPress }: VoucherCardProps) {
  const expiryDate = new Date(voucher.validUntil);
  const isExpired = isPast(expiryDate);
  const isRedeemed = voucher.status === 'redeemed';
  
  // Determine status
  let status: 'active' | 'redeemed' | 'expired' = 'active';
  let statusColor = theme.colors.emeraldA;
  let statusIcon: any = 'checkmark-circle';
  let statusLabel = 'Active';
  
  if (isRedeemed) {
    status = 'redeemed';
    statusColor = '#999';
    statusIcon = 'checkmark-done-circle';
    statusLabel = 'Redeemed';
  } else if (isExpired) {
    status = 'expired';
    statusColor = '#ff4444';
    statusIcon = 'close-circle';
    statusLabel = 'Expired';
  }
  
  // Get prize type icon and color
  const getPrizeIcon = (): { icon: React.ComponentProps<typeof Ionicons>['name']; color: string } => {
    if (voucher.isDigitalPrize) {
      return { icon: 'code-slash', color: '#9C27B0' };
    }
    return { icon: 'gift', color: theme.colors.primaryGold };
  };
  
  const categoryInfo = getPrizeIcon();
  
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.categoryBadge, { backgroundColor: categoryInfo.color }]}>
          <Ionicons name={categoryInfo.icon} size={20} color="#fff" />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title} numberOfLines={1}>{voucher.raffleTitle}</Text>
          <Text style={styles.partner} numberOfLines={1}>{voucher.partnerName}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Ionicons name={statusIcon} size={16} color="#fff" />
        </View>
      </View>
      
      {/* Voucher Reference & Prize Value */}
      <View style={styles.codeContainer}>
        <Text style={styles.codeLabel}>Voucher Reference</Text>
        <View style={styles.codeBox}>
          <Text style={styles.codeText}>{voucher.voucherRef}</Text>
          <WwIcon name="copy" size={20} color="#E0A800" strokeWidth={1.6} />
        </View>
        <View style={styles.prizeValueRow}>
          <Text style={styles.prizeLabel}>Prize Value:</Text>
          <Text style={styles.prizeValue}>{voucher.prizeValue} {voucher.currency}</Text>
        </View>
      </View>
      
      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <WwIcon name="calendar" size={15} color="#8A96A1" strokeWidth={1.6} />
          <Text style={styles.footerText}>
            {isRedeemed 
              ? `Redeemed ${voucher.redeemedAt ? format(new Date(voucher.redeemedAt), 'MMM dd, yyyy') : 'Recently'}`
              : `Expires ${format(expiryDate, 'MMM dd, yyyy')}`
            }
          </Text>
        </View>
        {voucher.isDigitalPrize && (
          <View style={styles.footerItem}>
            <WwIcon name="code" size={15} color="#9C27B0" strokeWidth={1.6} />
            <Text style={[styles.footerText, { color: '#9C27B0' }]}>Digital Prize</Text>
          </View>
        )}
      </View>
      
      {/* View Details Button */}
      <View style={styles.viewDetailsContainer}>
        <Text style={styles.viewDetails}>View Details</Text>
        <WwIcon name="chevron" size={16} color="#E0A800" strokeWidth={1.8} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 26,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(44,62,80,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  partner: {
    fontSize: 13,
    color: '#666',
  },
  statusBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeContainer: {
    marginBottom: 16,
  },
  codeLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 6,
    fontWeight: '600',
  },
  prizeValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  prizeLabel: {
    fontSize: 13,
    color: '#999',
    fontWeight: '600',
  },
  prizeValue: {
    fontSize: 16,
    color: theme.colors.primaryGold,
    fontWeight: '700',
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF8E7',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: theme.colors.primaryGold,
    borderStyle: 'dashed',
  },
  codeText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
  viewDetailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  viewDetails: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primaryGold,
    marginRight: 4,
  },
});
