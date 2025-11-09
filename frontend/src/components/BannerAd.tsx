import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { getAdUnit } from '../utils/adConfig';

interface BannerAdComponentProps {
  position?: 'top' | 'bottom';
}

const BannerAdComponent: React.FC<BannerAdComponentProps> = ({ position = 'bottom' }) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
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
        onAdFailedToLoad={(error) => {
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