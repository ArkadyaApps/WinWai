import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Platform } from 'react-native';

// window.adsbygoogle's type is already declared globally in
// RewardedAdManager.ts.
// In-feed ad unit created in the AdSense dashboard (Card layout, image top,
// 3-column feed) to match the raffle/sponsor card look. Same ca-pub as
// RewardedAdManager.ts - the adsbygoogle.js script is already loaded
// site-wide in app/+html.tsx, so this only needs to push once per <ins>
// instance once it's mounted.
const AD_CLIENT = 'ca-pub-3486145054830108';
const AD_SLOT = '7374708461';
const AD_LAYOUT_KEY = '-6t+ed+2i-1n-4w';

const AdCard: React.FC = () => {
  const pushed = useRef(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || pushed.current) return;
    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
      pushed.current = true;
    } catch (error) {
      console.error('AdSense in-feed push failed:', error);
    }
  }, []);

  if (Platform.OS !== 'web') return null;

  return (
    <View style={styles.card}>
      {React.createElement('ins', {
        className: 'adsbygoogle',
        style: { display: 'block', width: '100%', minHeight: 160 },
        'data-ad-format': 'fluid',
        'data-ad-layout-key': AD_LAYOUT_KEY,
        'data-ad-client': AD_CLIENT,
        'data-ad-slot': AD_SLOT,
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    minHeight: 160,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 12 },
      android: { elevation: 8 },
      web: { boxShadow: '0 6px 20px rgba(0,0,0,0.08)' },
    }),
  },
});

export default AdCard;
