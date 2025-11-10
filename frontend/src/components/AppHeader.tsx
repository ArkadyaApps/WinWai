import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/tokens';

interface Props {
  title: string;
  variant?: 'gold' | 'emerald' | 'mint';
  onBack?: () => void;
  right?: React.ReactNode;
  patternUri?: string;
}

export default function AppHeader({ title, variant = 'gold', onBack, right, patternUri }: Props) {
  const colors = theme.gradients[variant];
  const defaultPattern = 'https://images.unsplash.com/photo-1545873692-64145c8c42ed?q=85&w=1200&auto=format&fit=crop';

  return (
    <LinearGradient colors={colors as any} style={styles.header}>
      {/* Subtle pattern overlay */}
      <Image
        source={{ uri: patternUri || defaultPattern }}
        style={styles.pattern}
        resizeMode="cover"
      />
      <View style={styles.side}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={24} color={variant === 'gold' ? '#000' : '#fff'} />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconPlaceholder} />
        )}
      </View>
      <Text style={[styles.title, { color: variant === 'gold' ? '#000' : '#fff' }]}>{title}</Text>
      <View style={styles.side}>{right ?? <View style={styles.iconPlaceholder} />}</View>
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
  pattern: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.06,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  side: { width: 40, alignItems: 'center' },
  iconBtn: { padding: 8 },
  iconPlaceholder: { width: 24, height: 24 },
});
