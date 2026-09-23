import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Platform } from 'react-native';

// window.adsbygoogle's type is already declared globally in
// RewardedAdManager.ts.
// In-feed ad unit created in the AdSense dashboard (Card layout, image top,
// 3-column feed) to match the raffle/sponsor card look. Same ca-pub as
// RewardedAdManager.ts - the adsbygoogle.js script is already loaded
// site-wide in app/+html.tsx.
const AD_CLIENT = 'ca-pub-3486145054830108';
const AD_SLOT = '7374708461';
const AD_LAYOUT_KEY = '-6t+ed+2i-1n-4w';

const AdCard: React.FC = () => {
  const containerRef = useRef<any>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || initialized.current) return;
    const container = containerRef.current as HTMLElement | null;
    if (!container) return;
    initialized.current = true;

    // Built with plain DOM APIs, outside React's virtual DOM, on purpose:
    // AdSense's script mutates and sometimes relocates this element (an
    // unfilled fluid unit gets moved to be a direct child of <body> and
    // hidden). If React had rendered the <ins> itself, its next re-render
    // (e.g. Home reloading raffles once geolocation resolves) tries to
    // reconcile a node Google already ripped out from under it - that
    // mismatch was what made the whole card vanish, not just the ad
    // content. A container React only ever renders empty (no declared
    // children) is never re-diffed, so Google can do whatever it wants to
    // what's inside without React fighting it.
    const ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'block';
    ins.style.width = '100%';
    ins.style.minHeight = '160px';
    ins.setAttribute('data-ad-format', 'fluid');
    ins.setAttribute('data-ad-layout-key', AD_LAYOUT_KEY);
    ins.setAttribute('data-ad-client', AD_CLIENT);
    ins.setAttribute('data-ad-slot', AD_SLOT);
    container.appendChild(ins);

    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
    } catch (error) {
      console.error('AdSense in-feed push failed:', error);
    }
  }, []);

  if (Platform.OS !== 'web') return null;

  return <View ref={containerRef} style={styles.card} />;
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
