import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { Raffle } from '../types';
import { useTranslation } from '../i18n/useTranslation';

interface RaffleRoundStatusProps {
  raffle: Raffle;
  variant?: 'full' | 'compact';
}

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

interface Units {
  d: string;
  h: string;
  m: string;
  s: string;
}

export const formatRemaining = (ms: number, u: Units): string => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (days > 0) return `${days}${u.d} ${hours}${u.h}`;
  if (hours > 0) return `${hours}${u.h} ${minutes}${u.m}`;
  return `${minutes}${u.m} ${seconds}${u.s}`;
};

// Ticks once a second only in the final hour (that's where seconds matter);
// otherwise every 30s. No timer at all while there's nothing to count down.
function useNow(scheduledMs: number | null): number {
  const [now, setNow] = useState(Date.now());
  const fast = scheduledMs !== null && scheduledMs - now <= HOUR_MS;
  useEffect(() => {
    if (scheduledMs === null) return;
    const tick = () => setNow(Date.now());
    const interval = setInterval(tick, fast ? 1000 : 30000);
    tick();
    return () => clearInterval(interval);
  }, [scheduledMs, fast]);
  return now;
}

const RaffleRoundStatus: React.FC<RaffleRoundStatusProps> = ({ raffle, variant = 'full' }) => {
  const { t } = useTranslation();
  const compact = variant === 'compact';

  const goal = raffle.gamePrice > 0 ? raffle.gamePrice : 1;
  const roundTickets = raffle.roundTickets ?? 0;
  const scheduledMs = raffle.scheduledDrawAt ? new Date(raffle.scheduledDrawAt).getTime() : null;
  const startsMs = raffle.startsAt ? new Date(raffle.startsAt).getTime() : null;
  const now = useNow(startsMs !== null && startsMs > Date.now() ? startsMs : scheduledMs);
  const comingSoon = startsMs !== null && startsMs > now;
  const remaining = scheduledMs === null ? null : scheduledMs - now;
  const finished = !raffle.active || raffle.prizesRemaining <= 0;
  const goalMet = scheduledMs !== null;
  const closing = remaining !== null && remaining <= 0;
  const lastHour = remaining !== null && remaining > 0 && remaining <= HOUR_MS;
  const fraction = goalMet ? 1 : Math.min(1, roundTickets / goal);

  // Progress bar fills smoothly whenever the count changes.
  const fill = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fill, { toValue: fraction, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [fraction]);

  // Gentle pulse on the countdown once the draw is under an hour away.
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!lastHour) {
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: Platform.OS !== 'web' }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [lastHour]);

  if (finished) {
    return compact ? null : (
      <View style={styles.card}>
        <Text style={styles.finishedText}>{t('raffleRound.allAwarded')}</Text>
      </View>
    );
  }

  if (comingSoon && startsMs !== null) {
    const soonUnits: Units = { d: t('raffleRound.unitDay'), h: t('raffleRound.unitHour'), m: t('raffleRound.unitMinute'), s: t('raffleRound.unitSecond') };
    if (compact) {
      return (
        <View style={styles.compactRow}>
          <Ionicons name="hourglass-outline" size={11} color="#E67E22" />
          <Text style={[styles.compactText, styles.soonText]} numberOfLines={1}>{t('raffleRound.comingSoon')}</Text>
        </View>
      );
    }
    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={styles.soonBadge}>
            <Ionicons name="hourglass-outline" size={14} color="#E67E22" />
            <Text style={styles.soonBadgeText}>{t('raffleRound.comingSoon')}</Text>
          </View>
          <Text style={styles.progressText}>{t('raffleRound.startsIn').replace('{time}', formatRemaining(startsMs - now, soonUnits))}</Text>
        </View>
        <Text style={styles.note}>{t('raffleRound.startsOn').replace('{date}', format(new Date(startsMs), 'dd MMM yyyy, HH:mm'))}</Text>
      </View>
    );
  }

  const units: Units = { d: t('raffleRound.unitDay'), h: t('raffleRound.unitHour'), m: t('raffleRound.unitMinute'), s: t('raffleRound.unitSecond') };
  const progressText = t('raffleRound.ticketsProgress').replace('{current}', String(Math.min(roundTickets, goal))).replace('{goal}', String(goal));
  const countdownText = closing
    ? t('raffleRound.drawingSoon')
    : remaining !== null
      ? t('raffleRound.drawIn').replace('{time}', formatRemaining(remaining, units))
      : null;

  const bar = (
    <View style={[styles.track, compact && styles.trackCompact]}>
      <Animated.View
        style={[
          styles.fill,
          goalMet && styles.fillDone,
          { width: fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
        ]}
      />
    </View>
  );

  if (compact) {
    // Grid cards are ~115px wide: show only the value next to an icon (a full
    // "Draw in ..." sentence gets ellipsized, hiding the time - worst in Thai).
    const compactText = closing
      ? t('raffleRound.drawingSoon')
      : remaining !== null
        ? formatRemaining(remaining, units)
        : `${Math.min(roundTickets, goal)}/${goal}`;
    return (
      <View style={styles.compact}>
        {bar}
        <View style={styles.compactRow}>
          <Ionicons name={goalMet ? 'time-outline' : 'ticket-outline'} size={11} color={goalMet ? '#0F8B6D' : '#95A5A6'} />
          <Animated.Text
            style={[styles.compactText, goalMet && styles.compactTextDone, lastHour && { transform: [{ scale: pulse }] }]}
            numberOfLines={1}
          >
            {compactText}
          </Animated.Text>
        </View>
      </View>
    );
  }

  const roundLabel =
    raffle.prizesAvailable > 1
      ? t('raffleRound.round').replace('{current}', String(raffle.currentRound ?? 1)).replace('{total}', String(raffle.prizesAvailable))
      : null;
  // Tier delays are always whole days (1 / 3 / 7) - the API owns the rule.
  const delayText =
    raffle.drawDelayMs !== undefined
      ? t('raffleRound.drawDelayNote').replace('{time}', `${Math.round(raffle.drawDelayMs / DAY_MS)}${units.d}`)
      : null;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        {roundLabel ? <Text style={styles.roundLabel}>{roundLabel}</Text> : <View />}
        {goalMet ? (
          <View style={styles.goalBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#0F8B6D" />
            <Text style={styles.goalBadgeText}>{t('raffleRound.goalReached')}</Text>
          </View>
        ) : null}
      </View>

      {bar}

      <View style={styles.footerRow}>
        <Text style={styles.progressText}>{progressText}</Text>
        {countdownText ? (
          <Animated.View style={[styles.countdown, lastHour && styles.countdownHot, { transform: [{ scale: pulse }] }]}>
            <Ionicons name="time-outline" size={14} color={lastHour ? '#fff' : '#2C3E50'} />
            <Text style={[styles.countdownText, lastHour && styles.countdownTextHot]}>{countdownText}</Text>
          </Animated.View>
        ) : null}
      </View>

      {closing ? (
        <Text style={styles.note}>{t('raffleRound.entriesClosed')}</Text>
      ) : !goalMet ? (
        <Text style={styles.note}>{delayText ?? t('raffleRound.drawTBD')}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginTop: 16, marginBottom: 8 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  roundLabel: { fontSize: 13, fontWeight: '800', color: '#2C3E50' },
  goalBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E8F8F5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  goalBadgeText: { fontSize: 12, fontWeight: '700', color: '#0F8B6D' },
  track: { height: 12, borderRadius: 6, backgroundColor: '#F0F0F0', overflow: 'hidden' },
  trackCompact: { height: 6, borderRadius: 3 },
  fill: { height: '100%', borderRadius: 6, backgroundColor: '#FFC200' },
  fillDone: { backgroundColor: '#4ECDC4' },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, gap: 8, flexWrap: 'wrap' },
  progressText: { fontSize: 14, fontWeight: '700', color: '#2C3E50' },
  countdown: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F8F9FA', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  countdownHot: { backgroundColor: '#FF6B6B' },
  countdownText: { fontSize: 13, fontWeight: '800', color: '#2C3E50' },
  countdownTextHot: { color: '#fff' },
  note: { fontSize: 12, color: '#95A5A6', marginTop: 8, lineHeight: 17 },
  soonBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEF5E7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  soonBadgeText: { fontSize: 12, fontWeight: '800', color: '#E67E22' },
  soonText: { color: '#E67E22' },
  finishedText: { fontSize: 14, fontWeight: '700', color: '#7F8C8D', textAlign: 'center' },
  compact: { gap: 5, marginTop: 2 },
  compactRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  compactText: { fontSize: 10, fontWeight: '700', color: '#95A5A6' },
  compactTextDone: { color: '#0F8B6D' },
});

export default RaffleRoundStatus;
