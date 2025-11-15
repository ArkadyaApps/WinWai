import { Platform, Alert } from 'react-native';

class InterstitialAdManager {
  private interstitialAd: any = null;
  private adLoaded = false;
  private isShowing = false;

  async initialize(): Promise<void> {
    console.log('==================== INTERSTITIAL AD INIT ====================');
    
    // Only load ads on native platforms
    if (Platform.OS === 'web') {
      console.log('❌ InterstitialAd: Web platform not supported');
      return;
    }

    try {
      const { InterstitialAd, AdEventType, TestIds } = await import('react-native-google-mobile-ads');
      
      // Use test ads in development, real ads in production
      const adUnitId = __DEV__ 
        ? TestIds.INTERSTITIAL
        : Platform.select({
            ios: 'ca-app-pub-3486145054830108/REPLACE_WITH_YOUR_IOS_INTERSTITIAL_ID',
            android: 'ca-app-pub-3486145054830108/REPLACE_WITH_YOUR_ANDROID_INTERSTITIAL_ID',
          }) || TestIds.INTERSTITIAL;

      console.log('🎯 Interstitial Ad Unit ID:', adUnitId);

      this.interstitialAd = InterstitialAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: false,
        keywords: ['game', 'raffle', 'prize'],
      });

      // Set up event listeners
      this.interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
        console.log('✅ Interstitial ad loaded');
        this.adLoaded = true;
      });

      this.interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
        console.log('🔄 Interstitial ad closed, reloading next ad...');
        this.isShowing = false;
        this.adLoaded = false;
        // Reload next ad
        this.loadAd();
      });

      this.interstitialAd.addAdEventListener(AdEventType.ERROR, (error: any) => {
        console.error('❌ Interstitial ad error:', error);
        this.adLoaded = false;
        this.isShowing = false;
      });

      // Load the first ad
      await this.loadAd();
      
    } catch (error: any) {
      console.error('❌ InterstitialAd initialization error:', error);
    }
  }

  async loadAd(): Promise<void> {
    if (Platform.OS === 'web' || !this.interstitialAd) return;
    
    try {
      console.log('📡 Loading interstitial ad...');
      await this.interstitialAd.load();
    } catch (error: any) {
      console.error('❌ Failed to load interstitial ad:', error);
      this.adLoaded = false;
    }
  }

  async showAd(): Promise<boolean> {
    if (Platform.OS === 'web') {
      console.log('❌ Interstitial ads not available on web');
      return false;
    }

    if (this.isShowing) {
      console.log('⏳ Ad already showing');
      return false;
    }

    if (!this.interstitialAd || !this.adLoaded) {
      console.log('❌ Interstitial ad not ready');
      return false;
    }

    try {
      console.log('🎬 Showing interstitial ad...');
      this.isShowing = true;
      await this.interstitialAd.show();
      return true;
    } catch (error) {
      console.error('❌ Failed to show interstitial ad:', error);
      this.isShowing = false;
      return false;
    }
  }

  isReady(): boolean {
    return this.adLoaded && !this.isShowing && Platform.OS !== 'web';
  }
}

export const interstitialAdManager = new InterstitialAdManager();
