import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Platform } from 'react-native';

interface BannerAdComponentProps {
  position?: 'top' | 'bottom';
}

const BannerAdComponent: React.FC<BannerAdComponentProps> = ({ position = 'bottom' }) => {
  const [BannerAd, setBannerAd] = useState<any>(null);
  const [BannerAdSize, setBannerAdSize] = useState<any>(null);
  const [TestIds, setTestIds] = useState<any>(null);

  // Don't show ads on web - just return null
  if (Platform.OS === 'web') {
    return null;
  }

  useEffect(() => {
    // Dynamically import AdMob components on native platforms
    const loadAdMob = async () => {
      try {
        const admobModule = await import('react-native-google-mobile-ads');
        setBannerAd(() => admobModule.BannerAd);
        setBannerAdSize(() => admobModule.BannerAdSize);
        setTestIds(admobModule.TestIds);
      } catch (error) {
        console.log('Banner Ad: AdMob module not available');
      }
    };
    loadAdMob();
  }, []);

  // Wait for AdMob module to load
  if (!BannerAd || !BannerAdSize || !TestIds) {
    return null;
  }

  // Use test banner in dev, real banner in production
  const adUnitId = __DEV__
    ? TestIds.BANNER
    : Platform.select({
        ios: 'ca-app-pub-3486145054830108/3199369828',
        android: 'ca-app-pub-3486145054830108/7932273019',
      }) || TestIds.BANNER;

  return (
    <View style={[styles.container, position === 'top' && styles.topPosition]}>
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: false,
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