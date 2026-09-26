import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import WwIcon, { WwIconName } from '../ui/WwIcon';

// Slowly drifting colour orbs behind the hero (soft radial gradients on web,
// translucent discs elsewhere). Purely decorative: transform-only animation.
interface OrbProps {
  color: string;
  size: number;
  top: number | string;
  left: number | string;
  dx: number;
  dy: number;
  duration: number;
}

const Orb: React.FC<OrbProps> = ({ color, size, top, left, dx, dy, duration }) => {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(t, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: Platform.OS !== 'web' }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
  const webStyle: any = Platform.OS === 'web' ? { backgroundImage: `radial-gradient(circle at 50% 50%, ${color}, rgba(255,255,255,0) 68%)` } : { backgroundColor: color, opacity: 0.35 };
  return (
    <Animated.View
      style={[
        { position: 'absolute', top: top as any, left: left as any, width: size, height: size, borderRadius: size / 2 },
        webStyle,
        { transform: [{ translateX: t.interpolate({ inputRange: [0, 1], outputRange: [0, dx] }) }, { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, dy] }) }] },
      ]}
    />
  );
};

interface FloaterProps {
  icon: WwIconName;
  color: string;
  left: string;
  size: number;
  duration: number;
  delay: number;
  spin: number;
  rise?: number;
}

// One small glyph that drifts upward, turning slowly, then fades and restarts.
export const Floater: React.FC<FloaterProps> = ({ icon, color, left, size, duration, delay, spin, rise = 420 }) => {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(t, { toValue: 1, duration, delay, easing: Easing.linear, useNativeDriver: Platform.OS !== 'web' }));
    loop.start();
    return () => loop.stop();
  }, []);
  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: left as any,
        bottom: -30,
        opacity: t.interpolate({ inputRange: [0, 0.15, 0.8, 1], outputRange: [0, 0.95, 0.8, 0] }),
        transform: [
          { translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, -rise] }) },
          { rotate: t.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${spin}deg`] }) },
        ],
      }}
    >
      <WwIcon name={icon} size={size} color={color} strokeWidth={1.3} />
    </Animated.View>
  );
};

/** A few drifting glyphs for compact areas such as the app header. */
export const GlyphField: React.FC<{ color?: string; rise?: number }> = ({ color = '#FFFFFF', rise = 150 }) => (
  <View style={styles.fill} pointerEvents="none">
    <Floater icon="ticket" color={color} left="6%" size={26} duration={7000} delay={0} spin={-20} rise={rise} />
    <Floater icon="sparkle" color={color} left="26%" size={16} duration={8500} delay={1800} spin={80} rise={rise} />
    <Floater icon="gift" color={color} left="70%" size={24} duration={7600} delay={900} spin={16} rise={rise} />
    <Floater icon="sparkle" color={color} left="84%" size={14} duration={9000} delay={3200} spin={-80} rise={rise} />
    <Floater icon="trophy" color={color} left="92%" size={24} duration={8000} delay={2400} spin={-14} rise={rise} />
  </View>
);

const AuroraBackground: React.FC = () => (
  <View style={styles.fill} pointerEvents="none">
    <Orb color="rgba(255,205,0,0.60)" size={340} top={-90} left={-110} dx={70} dy={40} duration={9000} />
    <Orb color="rgba(255,138,96,0.38)" size={300} top={40} left="52%" dx={-60} dy={70} duration={11000} />
    <Orb color="rgba(78,205,196,0.38)" size={260} top={260} left="-12%" dx={80} dy={-40} duration={13000} />
    <Floater icon="ticket" color="#E0A800" left="8%" size={26} duration={9000} delay={0} spin={-24} />
    <Floater icon="sparkle" color="#FF8A60" left="24%" size={20} duration={11000} delay={2500} spin={90} />
    <Floater icon="gift" color="#0F8B6D" left="44%" size={24} duration={10000} delay={1200} spin={18} />
    <Floater icon="sparkle" color="#E0A800" left="63%" size={18} duration={12000} delay={4200} spin={-90} />
    <Floater icon="ticket" color="#FF8A60" left="80%" size={28} duration={9500} delay={3400} spin={26} />
    <Floater icon="trophy" color="#E0A800" left="92%" size={22} duration={11500} delay={800} spin={-16} />
  </View>
);

const styles = StyleSheet.create({
  fill: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
});

export default AuroraBackground;
