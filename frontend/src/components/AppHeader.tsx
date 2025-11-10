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
  showLogo?: boolean;
  logoUri?: string;
  size?: 'normal' | 'tall';
}

export default function AppHeader({
  title,
  variant = 'gold',
  onBack,
  right,
  patternUri,
  showLogo = false,
  logoUri,
  size = 'normal',
}: Props) {
  const colors = theme.gradients[variant];
  const defaultPattern = 'https://images.unsplash.com/photo-1545873692-64145c8c42ed?q=85&w=1200&auto=format&fit=crop';
  const isLight = variant === 'gold';
  const headerStyle = [
    styles.header,
    size === 'tall' && styles.headerTall,
  ];
  return (
    <LinearGradient colors={colors as any} style={headerStyle as any}>
      {/* Subtle pattern overlay */}
      <Image source={{ uri: patternUri || defaultPattern }} style={styles.pattern} resizeMode="cover" />

      <View style={styles.side}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={24} color={isLight ? '#000' : '#fff'} />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconPlaceholder} />
        )}
      </View>

      <View style={styles.center}>
        {showLogo && (
          <Image
            source={{ uri: logoUri || 'https://customer-assets.emergentagent.com/job_raffleprize/artifacts/1bule6ml_logo.jpg' }}
            style={[styles.logo, size === 'tall' && styles.logoTall]}
            resizeMode="contain"
          />
        )}
        {title ? (
          <Text style={[styles.title, { color: isLight ? '#000' : '#fff' }, size === 'tall' && styles.titleTall]}>
            {title}
          </Text>
        ) : null}
      </View>

      <View style={[styles.side, { alignItems: 'flex-end' }]}>
        {right ?? <View style={styles.iconPlaceholder} />}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    overflow: 'hidden',
  },
  headerTall: {
    paddingBottom: 24,
  },
  pattern: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.06,
  },
  side: {
    width: 64,
  },
  iconBtn: { padding: 8 },
  iconPlaceholder: { width: 24, height: 24 },
  center: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.75)',
  },
  logoTall: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  titleTall: {
    fontSize: 22,
  },
});
