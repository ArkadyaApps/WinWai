import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Image, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/tokens';
import { GlyphField } from './landing/AuroraBackground';

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
  const defaultLogo = 'https://customer-assets.emergentagent.com/job_raffle-rewards-1/artifacts/tsv1bcjh_logo.png';
  const isLight = variant === 'gold';
  // The logo "breathes" very slightly so the header never feels static.
  const breathe = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(breathe, { toValue: 0, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: Platform.OS !== 'web' }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
  const dividerColor = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.14)';

  return (
    <LinearGradient colors={colors as any} style={styles.header}>
      {/* Subtle pattern overlay */}
      <Image source={{ uri: patternUri || defaultPattern }} style={styles.pattern} resizeMode="cover" />
      <GlyphField color="#FFFFFF" rise={170} />

      {/* Logo centered at top */}
      <View style={styles.logoContainer}>
        <Animated.View style={{ transform: [{ scale: breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.035] }) }] }}>
          <Image
            source={{ uri: logoUri || defaultLogo }}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>
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
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 12,
    overflow: 'hidden',
  },
  pattern: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.06,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  logo: {
    width: 288,
    height: 115,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  side: {
    minWidth: 72,
  },
  spacer: {
    flex: 1,
  },
  iconBtn: { padding: 8 },
  iconPlaceholder: { width: 24, height: 24 },
  divider: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 1,
  },
});
