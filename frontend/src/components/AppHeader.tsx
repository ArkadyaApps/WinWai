import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme/tokens';

interface Props {
  title: string;
  variant?: 'gold' | 'emerald' | 'mint';
  onBack?: () => void;
  right?: React.ReactNode;
}

export default function AppHeader({ title, variant = 'gold', onBack, right }: Props) {
  const colors = theme.gradients[variant];
  return (
    <LinearGradient colors={colors as any} style={styles.header}>
      <View style={styles.side}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconPlaceholder} />
        )}
      </View>
      <Text style={styles.title}>{title}</Text>
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
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  side: { width: 40, alignItems: 'center' },
  iconBtn: { padding: 8 },
  iconPlaceholder: { width: 24, height: 24 },
});
