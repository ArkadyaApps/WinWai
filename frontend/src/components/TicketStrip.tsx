import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import WwIcon from './ui/WwIcon';
import AnimatedNumber from './ui/AnimatedNumber';
import { GlyphField } from './landing/AuroraBackground';
import { FONT_DISPLAY } from '../theme/fonts';

interface TicketStripProps {
  tickets: number;
  balanceLabel: string;
  earnLabel: string;
  accessibilityLabel?: string;
}

/**
 * Home "wallet" strip: the ticket balance (counts up when it changes) and a
 * one-tap route to earning more, with a pulsing ring on the button.
 */
const TicketStrip: React.FC<TicketStripProps> = ({ tickets, balanceLabel, earnLabel, accessibilityLabel }) => {
  const router = useRouter();
  const ring = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(Animated.timing(ring, { toValue: 1, duration: 1800, easing: Easing.out(Easing.quad), useNativeDriver: Platform.OS !== 'web' }));
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <View style={styles.shell}>
      <LinearGradient colors={['#FFE680', '#FFC200']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.core}>
        <GlyphField color="#FFFFFF" rise={90} />
        <View style={styles.left}>
          <View style={styles.disc}>
            <WwIcon name="ticket" size={26} color="#7A5C00" strokeWidth={1.5} />
          </View>
          <View>
            <Text style={styles.label} numberOfLines={1}>{balanceLabel}</Text>
            <AnimatedNumber value={tickets} style={styles.amount} />
          </View>
        </View>

        <TouchableOpacity activeOpacity={0.9} style={styles.buttonWrap} onPress={() => router.push('/(tabs)/tickets')} accessibilityRole="button" accessibilityLabel={accessibilityLabel}>
          <Animated.View
            pointerEvents="none"
            style={[styles.ring, { opacity: ring.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }), transform: [{ scale: ring.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] }) }] }]}
          />
          <View style={styles.button}>
            <WwIcon name="play" size={18} color="#FFD700" strokeWidth={1.7} />
            <Text style={styles.buttonText} numberOfLines={1}>{earnLabel}</Text>
          </View>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  shell: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 5,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(44,62,80,0.07)',
  },
  core: {
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    overflow: 'hidden',
    ...Platform.select({ web: { boxShadow: '0 22px 40px -24px rgba(224,168,0,0.95)' } as any, default: {} }),
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1 },
  disc: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: FONT_DISPLAY, fontSize: 11, fontWeight: '700', color: '#7A5C00', letterSpacing: 0.4 },
  amount: { fontFamily: FONT_DISPLAY, fontSize: 30, lineHeight: 34, fontWeight: '800', color: '#1F2D3A' },
  buttonWrap: { flexShrink: 0 },
  ring: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 999, borderWidth: 2, borderColor: '#1F2D3A' },
  button: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1F2D3A', borderRadius: 999, paddingVertical: 11, paddingHorizontal: 16 },
  buttonText: { fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: '800', color: '#FFFFFF' },
});

export default TicketStrip;
