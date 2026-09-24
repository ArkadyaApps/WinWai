import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Platform } from 'react-native';
import { format } from 'date-fns';
import api from '../utils/api';
import { useTranslation } from '../i18n/useTranslation';

interface RecentWinner {
  maskedEmail: string;
  raffleTitle: string;
  wonAt: string;
}

const MS_PER_PX = 25; // ~40px per second
const REFRESH_MS = 5 * 60 * 1000;

// Scrolling "who just won" banner. The API only ever sends a masked email
// (e.g. so***@g***.com), the raffle and the date - nothing that identifies a
// winner. The content is rendered twice and slid by exactly one copy's width,
// so the loop is seamless.
const WinnersTicker: React.FC = () => {
  const { t } = useTranslation();
  const [winners, setWinners] = useState<RecentWinner[]>([]);
  const [contentWidth, setContentWidth] = useState(0);
  const x = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      api
        .get('/api/winners/recent')
        .then((res) => {
          if (!cancelled) setWinners(res.data);
        })
        .catch(() => {});
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const line = useMemo(
    () =>
      winners
        .map(
          (w) =>
            `\u{1F3C6} ${t('winnersTicker.won').replace('{email}', w.maskedEmail).replace('{raffle}', w.raffleTitle)} · ${format(new Date(w.wonAt), 'MMM dd')}`
        )
        .join('      •      '),
    [winners, t]
  );

  useEffect(() => {
    if (!contentWidth) return;
    x.setValue(0);
    const loop = Animated.loop(
      Animated.timing(x, { toValue: -contentWidth, duration: contentWidth * MS_PER_PX, easing: Easing.linear, useNativeDriver: Platform.OS !== 'web' })
    );
    loop.start();
    return () => loop.stop();
  }, [contentWidth, line]);

  if (winners.length === 0) return null;

  return (
    <View style={styles.bar} pointerEvents="none">
      <Animated.View style={[styles.track, { transform: [{ translateX: x }] }]}>
        <View style={styles.copy} onLayout={(e) => setContentWidth(e.nativeEvent.layout.width)}>
          <Text style={styles.text} numberOfLines={1}>{line}</Text>
          <Text style={styles.gap}>{'      •      '}</Text>
        </View>
        <View style={styles.copy}>
          <Text style={styles.text} numberOfLines={1}>{line}</Text>
          <Text style={styles.gap}>{'      •      '}</Text>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: { backgroundColor: '#2C3E50', overflow: 'hidden', paddingVertical: 8 },
  track: { flexDirection: 'row', alignSelf: 'flex-start' },
  copy: { flexDirection: 'row', flexShrink: 0 },
  text: { color: '#FFD700', fontSize: 13, fontWeight: '700', flexShrink: 0 },
  gap: { color: '#FFD700', fontSize: 13, opacity: 0.6, flexShrink: 0 },
});

export default WinnersTicker;
