import { Platform, Alert } from 'react-native';
import api from '../utils/api';

export interface RewardEvent {
  userId: string;
  rewardType: string;
  rewardAmount: number;
  transactionId: string;
  timestamp: number;
}

class RewardedAdManager {
  private isLoading = false;
  private currentUserId: string = '';
  private onRewardCallback?: (reward: RewardEvent) => void;
  private adReady = false;
  private rewardedInterstitial: any = null;

  async loadRewardedAd(userId: string): Promise<void> {
    console.log('==================== LOAD AD START ====================');
    console.log('🎯 Platform:', Platform.OS);
    console.log('🎯 User ID:', userId);
    console.log('🎯 __DEV__:', __DEV__);
    
    this.currentUserId = userId;
    this.adReady = false;
    
    // Only load ads on native platforms
    if (Platform.OS === 'web') {
      console.log('❌ AdMob: Web platform not supported');
      return;
    }

    try {
      console.log('📦 Importing AdMob module...');
      // Import AdMob module
      const { RewardedInterstitialAd, RewardedAdEventType, TestIds } = await import('react-native-google-mobile-ads');
      console.log('✅ AdMob module imported successfully');
      
      // Use test ads in development, real ads in production
      const adUnitId = __DEV__ 
        ? TestIds.REWARDED_INTERSTITIAL 
        : Platform.select({
            ios: 'ca-app-pub-3486145054830108/9341557600',
            android: 'ca-app-pub-3486145054830108/3753903590',
          }) || TestIds.REWARDED_INTERSTITIAL;

      console.log('🎯 Ad Unit ID:', adUnitId);
      console.log('🎯 Using test ads:', __DEV__ ? 'YES' : 'NO');

      console.log('📝 Creating rewarded ad instance...');
      this.rewardedInterstitial = RewardedInterstitialAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: false,
        keywords: ['game', 'raffle', 'prize', 'reward'],
      });
      console.log('✅ Rewarded ad instance created');

      // Set up event listeners
      console.log('📝 Setting up event listeners...');
      
      const unsubscribeLoaded = this.rewardedInterstitial.addAdEventListener(
        RewardedAdEventType.LOADED,
        () => {
          console.log('✅✅✅ AdMob: Rewarded ad LOADED successfully! ✅✅✅');
          this.adReady = true;
        }
      );

      const unsubscribeFailed = this.rewardedInterstitial.addAdEventListener(
        RewardedAdEventType.ERROR,
        (error: any) => {
          console.error('❌❌❌ AdMob: Ad FAILED to load:', error);
          console.error('Error details:', JSON.stringify(error, null, 2));
          this.adReady = false;
          Alert.alert('Ad Loading Failed', `Error: ${error.message || 'Unknown error'}`);
        }
      );

      const unsubscribeEarned = this.rewardedInterstitial.addAdEventListener(
        RewardedAdEventType.EARNED_REWARD,
        async (reward: any) => {
          console.log('🎉 AdMob: User earned reward:', reward);
          await this.handleRewardEarned(reward);
        }
      );

      // Load the ad
      console.log('📡 Starting ad load request...');
      await this.rewardedInterstitial.load();
      console.log('📡 Ad load request sent (waiting for LOADED event)...');
      
    } catch (error: any) {
      console.error('❌❌❌ AdMob initialization error:', error);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      console.error('Error details:', JSON.stringify(error, null, 2));
      this.isLoading = false;
      this.adReady = false;
      Alert.alert('AdMob Error', `Failed to initialize: ${error?.message || 'Unknown error'}`);
    }
    console.log('==================== LOAD AD END ====================');
  }

  async showRewardedAd(): Promise<void> {
    if (Platform.OS === 'web') {
      Alert.alert(
        'Ads Not Available',
        'Rewarded ads are only available on mobile devices. Install the app via Expo Go or production build to earn tickets!'
      );
      return;
    }

    if (!this.rewardedInterstitial || !this.adReady) {
      Alert.alert('Ad Not Ready', 'Please wait for the ad to load...');
      return;
    }

    try {
      await this.rewardedInterstitial.show();
      this.adReady = false;
      // Reload next ad
      setTimeout(() => {
        this.loadRewardedAd(this.currentUserId);
      }, 1000);
    } catch (error) {
      console.error('Failed to show rewarded ad:', error);
      Alert.alert('Ad Error', 'Failed to show ad. Please try again.');
    }
  }

  private async handleRewardEarned(reward: any): Promise<void> {
    try {
      const transactionId = this.generateTransactionId();
      const rewardEvent: RewardEvent = {
        userId: this.currentUserId,
        rewardType: reward.type || 'tickets',
        rewardAmount: 1, // 1 ticket per ad
        transactionId,
        timestamp: Date.now(),
      };

      // Send reward to backend
      const response = await api.post('/api/rewards/verify-ad', rewardEvent);
      
      if (response.data.success) {
        Alert.alert(
          '🎉 Tickets Earned!',
          `You earned ${response.data.ticketsAwarded} tickets!\nNew balance: ${response.data.newBalance} tickets`
        );
        
        // Call reward callback
        if (this.onRewardCallback) {
          this.onRewardCallback(rewardEvent);
        }
      }
    } catch (error: any) {
      console.error('Failed to process reward:', error);
      Alert.alert('Error', 'Failed to credit tickets. Please contact support.');
    }
  }

  isRewardedAdReady(): boolean {
    return this.adReady && Platform.OS !== 'web';
  }

  setRewardCallback(callback: (reward: RewardEvent) => void): void {
    this.onRewardCallback = callback;
  }

  private generateTransactionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const rewardedAdManager = new RewardedAdManager();