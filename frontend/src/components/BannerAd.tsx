import React, { useState } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { getAdUnit } from '../utils/adConfig';

interface BannerAdComponentProps {
  position?: 'top' | 'bottom';
}

// Conditionally import AdMob only on native platforms
let BannerAd: any, BannerAdSize: any;
if (Platform.OS !== 'web') {
  const AdMob = require('react-native-google-mobile-ads');
  BannerAd = AdMob.BannerAd;
  BannerAdSize = AdMob.BannerAdSize;
}

const BannerAdComponent: React.FC<BannerAdComponentProps> = ({ position = 'bottom' }) => {
  const [failed, setFailed] = useState(false);

  // Don't show ads on web
  if (Platform.OS === 'web' || failed) {
    return null;
  }

  const adUnitId = getAdUnit('banner');

  return (
    <View style={[styles.container, position === 'top' && styles.topPosition]}>
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          keywords: ['gaming', 'entertainment', 'rewards'],
        }}
        onAdFailedToLoad={(error: any) => {
          console.warn('Banner ad failed to load:', error);
          setFailed(true);
        }}
        onAdLoaded={() => {
          console.log('Banner ad loaded successfully');
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    height: 60,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  topPosition: {
    bottom: undefined,
    top: 0,
    borderTopWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
});

export default BannerAdComponent;