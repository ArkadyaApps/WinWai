import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Platform, LayoutChangeEvent } from 'react-native';
import WwIcon, { WwIconName } from '../ui/WwIcon';
import { useTranslation } from '../../i18n/useTranslation';
import { EASE_OUT_SOFT } from './Reveal';
import { FONT_DISPLAY } from '../../theme/fonts';

const STEPS: { icon: WwIconName; key: 'earn' | 'choose' | 'enter' | 'win' }[] = [
  { icon: 'play', key: 'earn' },
  { icon: 'gift', key: 'choose' },
  { icon: 'ticket', key: 'enter' },
  { icon: 'trophy', key: 'win' },
];
const STEP_MS = 2600;
const NODE = 52;
const nativeDriver = Platform.OS !== 'web';

/**
 * "What is WinWai" in one looping animation: a ticket travels along a track
 * through the four steps (earn -> choose -> enter -> win); each node lights up
 * as it arrives, the caption swaps with a soft rise, and the last step throws a
 * small burst. The card is a nested "bezel": a translucent outer shell around a
 * white core.
 */
const WhatIsWinWai: React.FC = () => {
  const { t } = useTranslation();
  const [active, setActive] = useState(0);
  const [trackWidth, setTrackWidth] = useState(0);

  const pos = useRef(new Animated.Value(0)).current;
  const scales = useRef(STEPS.map(() => new Animated.Value(1))).current;
  const glows = useRef(STEPS.map(() => new Animated.Value(0))).current;
  const caption = useRef(new Animated.Value(0)).current;
  const burst = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % STEPS.length), STEP_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    // The ticket glides to the active node (or slides back home after "win").
    Animated.timing(pos, { toValue: active, duration: active === 0 ? 900 : 950, easing: EASE_OUT_SOFT, useNativeDriver: nativeDriver }).start();
    scales.forEach((s, i) => Animated.spring(s, { toValue: i === active ? 1.16 : 1, friction: 6, tension: 110, useNativeDriver: nativeDriver }).start());
    glows.forEach((g, i) => Animated.timing(g, { toValue: i === active ? 1 : i < active ? 0.45 : 0, duration: 500, easing: EASE_OUT_SOFT, useNativeDriver: nativeDriver }).start());
    caption.setValue(0);
    Animated.timing(caption, { toValue: 1, duration: 650, easing: EASE_OUT_SOFT, useNativeDriver: nativeDriver }).start();
    if (active === STEPS.length - 1) {
      burst.setValue(0);
      Animated.timing(burst, { toValue: 1, duration: 1100, delay: 500, easing: Easing.out(Easing.cubic), useNativeDriver: nativeDriver }).start();
    }
  }, [active]);

  const span = Math.max(trackWidth - NODE, 0);
  const onTrackLayout = (e: LayoutChangeEvent) => setTrackWidth(e.nativeEvent.layout.width);
  const step = STEPS[active];

  return (
    <View style={styles.shell}>
      <View style={styles.core}>
        <View style={styles.eyebrow}>
          <Text style={styles.eyebrowText}>{t('landing.what.eyebrow')}</Text>
        </View>
        <Text style={styles.title}>{t('landing.what.title')}</Text>
        <Text style={styles.body}>{t('landing.what.body')}</Text>

        <View style={styles.stage} onLayout={onTrackLayout}>
          <View style={[styles.rail, { left: NODE / 2, right: NODE / 2 }]} />
          <Animated.View
            style={[
              styles.railFill,
              { left: NODE / 2, width: span, transform: [{ scaleX: pos.interpolate({ inputRange: [0, STEPS.length - 1], outputRange: [0.001, 1] }) }] },
            ]}
          />
          <View style={styles.nodes}>
            {STEPS.map((s, i) => (
              <Animated.View key={s.key} style={[styles.node, { transform: [{ scale: scales[i] }] }]}>
                <Animated.View style={[StyleSheet.absoluteFillObject, styles.nodeLit, { opacity: glows[i] }]} />
                <View style={styles.nodeIcon}>
                  <WwIcon name={s.icon} size={24} color="#2C3E50" strokeWidth={1.5} />
                </View>
              </Animated.View>
            ))}
          </View>
          {/* the travelling ticket */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.traveller,
              { transform: [{ translateX: pos.interpolate({ inputRange: [0, STEPS.length - 1], outputRange: [0, span] }) }] },
            ]}
          >
            <View style={styles.travellerChip}>
              <WwIcon name="ticket" size={16} color="#7A5C00" strokeWidth={1.6} />
            </View>
          </Animated.View>
          {/* winner burst over the last node */}
          {Array.from({ length: 6 }).map((_, i) => {
            const angle = (Math.PI * 2 * i) / 6;
            return (
              <Animated.View
                key={i}
                pointerEvents="none"
                style={[
                  styles.spark,
                  {
                    right: NODE / 2 - 4,
                    opacity: burst.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 0] }),
                    transform: [
                      { translateX: burst.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(angle) * 34] }) },
                      { translateY: burst.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(angle) * 34] }) },
                      { scale: burst.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.2, 1, 0.4] }) },
                    ],
                  },
                ]}
              />
            );
          })}
        </View>

        <Animated.View
          style={[styles.caption, { opacity: caption, transform: [{ translateY: caption.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }]}
        >
          <Text style={styles.captionStep}>{`${active + 1} / ${STEPS.length}`}</Text>
          <Text style={styles.captionTitle}>{t(`landing.what.steps.${step.key}.title`)}</Text>
          <Text style={styles.captionBody}>{t(`landing.what.steps.${step.key}.body`)}</Text>
        </Animated.View>

        <View style={styles.dots}>
          {STEPS.map((s, i) => (
            <View key={s.key} style={[styles.dot, i === active && styles.dotActive]} />
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // outer bezel shell
  shell: {
    width: '100%',
    maxWidth: 420,
    padding: 6,
    borderRadius: 34,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(44,62,80,0.07)',
    ...Platform.select({ web: { boxShadow: '0 30px 60px -28px rgba(122,92,0,0.30)' } as any, default: {} }),
  },
  // inner core, concentric radius
  core: {
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 20,
    ...Platform.select({ web: { boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.9)' } as any, default: {} }),
  },
  eyebrow: { alignSelf: 'flex-start', backgroundColor: '#FFF3C4', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 12 },
  eyebrowText: { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: '#7A5C00', textTransform: 'uppercase' },
  title: { fontFamily: FONT_DISPLAY, fontSize: 28, lineHeight: 34, fontWeight: '800', color: '#1F2D3A', letterSpacing: -0.5 },
  body: { fontFamily: FONT_DISPLAY, fontSize: 15, lineHeight: 23, color: '#5D6D7E', marginTop: 8 },
  stage: { height: 96, marginTop: 20, justifyContent: 'center' },
  rail: { position: 'absolute', top: 47, height: 2, backgroundColor: '#EEF0F2', borderRadius: 1 },
  railFill: { position: 'absolute', top: 47, height: 2, backgroundColor: '#FFC200', borderRadius: 1, transformOrigin: 'left center' as any },
  nodes: { flexDirection: 'row', justifyContent: 'space-between' },
  node: {
    width: NODE,
    height: NODE,
    borderRadius: NODE / 2,
    backgroundColor: '#F6F7F8',
    borderWidth: 1,
    borderColor: 'rgba(44,62,80,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  nodeLit: { backgroundColor: '#FFE27A' },
  nodeIcon: { position: 'relative', zIndex: 1 },
  traveller: { position: 'absolute', top: -2, left: 0, width: NODE, alignItems: 'center' },
  travellerChip: {
    width: 30,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({ web: { boxShadow: '0 8px 16px -6px rgba(224,168,0,0.6)' } as any, default: {} }),
  },
  spark: { position: 'absolute', top: 44, width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFC200' },
  caption: { marginTop: 6, minHeight: 84 },
  captionStep: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, color: '#B08900' },
  captionTitle: { fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: '800', color: '#1F2D3A', marginTop: 2 },
  captionBody: { fontFamily: FONT_DISPLAY, fontSize: 14, lineHeight: 21, color: '#5D6D7E', marginTop: 3 },
  dots: { flexDirection: 'row', gap: 6, marginTop: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#E3E6E9' },
  dotActive: { width: 20, backgroundColor: '#FFC200' },
});

export default WhatIsWinWai;
