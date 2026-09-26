import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Platform, LayoutChangeEvent } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import WwIcon, { WwIconName } from './ui/WwIcon';
import { FONT_DISPLAY } from '../theme/fonts';

const ICONS: Record<string, WwIconName> = {
  home: 'home',
  raffles: 'gift',
  tickets: 'ticket',
  rewards: 'trophy',
  profile: 'user',
};

/**
 * Floating "island" tab bar: a rounded glass-white pill detached from the
 * screen edge, with a gold indicator that springs between tabs. Labels come from
 * each screen's `title`, so they stay translated.
 */
export default function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const routes = state.routes.filter((r) => (descriptors[r.key].options as any).href !== null);
  const [width, setWidth] = useState(0);
  const x = useRef(new Animated.Value(0)).current;
  const pop = useRef(routes.map(() => new Animated.Value(1))).current;

  const inner = Math.max(width - 12, 0);
  const itemW = routes.length > 0 ? inner / routes.length : 0;
  const activeIndex = Math.max(
    routes.findIndex((r) => r.key === state.routes[state.index].key),
    0
  );

  const placed = useRef(false);
  useEffect(() => {
    if (!itemW) return;
    if (!placed.current) {
      // First layout: start on the active tab instead of sliding in from the first one.
      placed.current = true;
      x.setValue(activeIndex * itemW);
      pop.forEach((p, i) => p.setValue(i === activeIndex ? 1.12 : 1));
      return;
    }
    Animated.spring(x, { toValue: activeIndex * itemW, friction: 8, tension: 90, useNativeDriver: Platform.OS !== 'web' }).start();
    pop.forEach((p, i) =>
      Animated.spring(p, { toValue: i === activeIndex ? 1.12 : 1, friction: 5, tension: 140, useNativeDriver: Platform.OS !== 'web' }).start()
    );
  }, [activeIndex, itemW]);

  return (
    <View style={[styles.outer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.pill} onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
        {itemW > 0 && <Animated.View style={[styles.indicator, { width: itemW, transform: [{ translateX: x }] }]} />}
        {routes.map((route, i) => {
          const { options } = descriptors[route.key];
          const focused = i === activeIndex;
          const label = (options.title as string) ?? route.name;
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name as never);
          };
          return (
            <Pressable key={route.key} onPress={onPress} accessibilityRole="button" accessibilityLabel={label} accessibilityState={focused ? { selected: true } : {}} style={styles.item}>
              <Animated.View style={{ transform: [{ scale: pop[i] ?? 1 }] }}>
                <WwIcon name={ICONS[route.name] ?? 'home'} size={24} color={focused ? '#1F2D3A' : '#8A96A1'} strokeWidth={focused ? 1.7 : 1.4} />
              </Animated.View>
              <Text numberOfLines={1} style={[styles.label, focused && styles.labelActive]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { paddingHorizontal: 14, paddingTop: 8, backgroundColor: '#F8F9FA' },
  pill: {
    flexDirection: 'row',
    padding: 6,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(44,62,80,0.07)',
    ...Platform.select({ web: { boxShadow: '0 18px 40px -18px rgba(31,45,58,0.35)' } as any, default: { elevation: 8 } }),
  },
  indicator: { position: 'absolute', top: 6, bottom: 6, left: 6, borderRadius: 24, backgroundColor: '#FFE27A' },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 9, gap: 3 },
  label: { fontFamily: FONT_DISPLAY, fontSize: 10.5, fontWeight: '700', color: '#8A96A1' },
  labelActive: { color: '#1F2D3A' },
});
