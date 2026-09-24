import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import api from '../utils/api';
import { useTranslation } from '../i18n/useTranslation';

interface RaffleWinner {
  round: number;
  drawnAt: string;
  anonymousId: string;
}

interface RaffleWinnersListProps {
  raffleId: string;
  /** Changes whenever the raffle reloads, so newly drawn rounds show up. */
  refreshKey?: number | string;
}

// Anonymous by design: the API returns only the round, the draw time and an
// opaque ID - never a name, initials, email or user id.
const WinnerRow: React.FC<{ winner: RaffleWinner }> = ({ winner }) => {
  const { t } = useTranslation();
  const appear = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(appear, { toValue: 1, duration: 500, useNativeDriver: false }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.row,
        { opacity: appear, transform: [{ translateY: appear.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] },
      ]}
    >
      <View style={styles.trophy}>
        <Ionicons name="trophy" size={18} color="#FFC200" />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{t('raffleRound.roundWinner').replace('{round}', String(winner.round))}</Text>
        <Text style={styles.rowSub}>{t('raffleRound.winnerId').replace('{id}', winner.anonymousId)}</Text>
      </View>
      <Text style={styles.date}>{format(new Date(winner.drawnAt), 'MMM dd, yyyy')}</Text>
    </Animated.View>
  );
};

const RaffleWinnersList: React.FC<RaffleWinnersListProps> = ({ raffleId, refreshKey }) => {
  const { t } = useTranslation();
  const [winners, setWinners] = useState<RaffleWinner[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get(`/api/raffles/${raffleId}/winners`)
      .then((res) => {
        if (!cancelled) setWinners(res.data);
      })
      .catch(() => {
        if (!cancelled) setWinners([]);
      });
    return () => {
      cancelled = true;
    };
  }, [raffleId, refreshKey]);

  if (winners === null) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.title}>{t('raffleRound.winnersTitle')}</Text>
      {winners.length === 0 ? (
        <Text style={styles.empty}>{t('raffleRound.noWinnersYet')}</Text>
      ) : (
        winners.map((w) => <WinnerRow key={`${w.round}-${w.anonymousId}`} winner={w} />)
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: { marginTop: 24 },
  title: { fontSize: 18, fontWeight: '700', color: '#2C3E50', marginBottom: 12 },
  empty: { fontSize: 14, color: '#95A5A6' },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8, gap: 12 },
  trophy: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFF9E6', justifyContent: 'center', alignItems: 'center' },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: '700', color: '#2C3E50' },
  rowSub: { fontSize: 12, color: '#7F8C8D', marginTop: 2 },
  date: { fontSize: 12, color: '#95A5A6', fontWeight: '600' },
});

export default RaffleWinnersList;
