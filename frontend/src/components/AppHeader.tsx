import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/tokens';

interface Props {
  title?: string;
  variant?: 'gold' | 'emerald' | 'mint';
  onBack?: () => void;
  right?: React.ReactNode;
  patternUri?: string;
  logoUri?: string;
  showDivider?: boolean;
}

export default function AppHeader({
  title,
  variant = 'gold',
  onBack,
  right,
  patternUri,
  logoUri,
  showDivider = false,
}: Props) {
  const colors = theme.gradients[variant];
  const defaultPattern = 'https://images.unsplash.com/photo-1545873692-64145c8c42ed?q=85&w=1200&auto=format&fit=crop';
  const defaultLogo = 'https://customer-assets.emergentagent.com/job_raffle-rewards-1/artifacts/qlp006k7_logo.png';
  const isLight = variant === 'gold';
  const dividerColor = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.14)';

  return (
    <LinearGradient colors={colors as any} style={styles.header}>
      {/* Subtle pattern overlay */}
      <Image source={{ uri: patternUri || defaultPattern }} style={styles.pattern} resizeMode="cover" />

      {/* Logo centered at top */}
      <View style={styles.logoContainer}>
        <Image
          source={{ uri: logoUri || defaultLogo }}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Controls row at bottom */}
      <View style={styles.controlsRow}>
        <View style={styles.side}>
          {onBack ? (
            <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
              <Ionicons name="arrow-back" size={24} color={isLight ? '#000' : '#fff'} />
            </TouchableOpacity>
          ) : (
            <View style={styles.iconPlaceholder} />
          )}
        </View>

        <View style={styles.spacer} />

        <View style={[styles.side, { alignItems: 'flex-end' }]}>
          {right ?? <View style={styles.iconPlaceholder} />}
        </View>
      </View>

      {showDivider && <View style={[styles.divider, { backgroundColor: dividerColor }]} />}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 64 : 48,
    paddingBottom: 20,
    overflow: 'hidden',
  },
  pattern: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.06,
  },
  side: {
    width: 72,
  },
  iconBtn: { padding: 8 },
  iconPlaceholder: { width: 24, height: 24 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  logo: {
    width: 360,
    height: 144,
  },
  divider: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 1,
  },
});
