import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Platform } from 'react-native';

interface BannerAdComponentProps {
  position?: 'top' | 'bottom';
}

// Global flag to track if an ad is currently loading to prevent multiple simultaneous requests
let isAdLoading = false;
let lastAdLoadTime = 0;
const AD_LOAD_COOLDOWN = 2000; // 2 seconds between ad requests

const BannerAdComponent: React.FC<BannerAdComponentProps> = ({ position = 'bottom' }) => {
  const [BannerAd, setBannerAd] = useState<any>(null);
  const [BannerAdSize, setBannerAdSize] = useState<any>(null);
  const [TestIds, setTestIds] = useState<any>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const mountedRef = useRef(true);

  // Don't show ads on web - just return null
  if (Platform.OS === 'web') {
    return null;
  }

  useEffect(() => {
    mountedRef.current = true;
    
    // Dynamically import AdMob components on native platforms
    const loadAdMob = async () => {
      try {
        const admobModule = await import('react-native-google-mobile-ads');
        if (mountedRef.current) {
          setBannerAd(() => admobModule.BannerAd);
          setBannerAdSize(() => admobModule.BannerAdSize);
          setTestIds(admobModule.TestIds);
          
          // Add delay before allowing ad to load to prevent rate limiting
          const now = Date.now();
          const timeSinceLastLoad = now - lastAdLoadTime;
          
          if (timeSinceLastLoad < AD_LOAD_COOLDOWN) {
            setTimeout(() => {
              if (mountedRef.current && !isAdLoading) {
                setShouldLoad(true);
              }
            }, AD_LOAD_COOLDOWN - timeSinceLastLoad);
          } else if (!isAdLoading) {
            setShouldLoad(true);
          }
        }
      } catch (error) {
        console.log('Banner Ad: AdMob module not available');
      }
    };
    loadAdMob();
    
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Wait for AdMob module to load and cooldown period
  if (!BannerAd || !BannerAdSize || !TestIds || !shouldLoad) {
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
        onAdLoaded={() => {
          isAdLoading = false;
          lastAdLoadTime = Date.now();
          console.log('✅ Banner Ad loaded successfully');
        }}
        onAdFailedToLoad={(error) => {
          isAdLoading = false;
          lastAdLoadTime = Date.now();
          console.error('❌ Banner Ad failed to load:', error);
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