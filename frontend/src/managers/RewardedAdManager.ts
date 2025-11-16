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
      const { RewardedAd, RewardedAdEventType, TestIds } = await import('react-native-google-mobile-ads');
      console.log('✅ AdMob module imported successfully');
      
      // Use test ads in development, real ads in production
      const adUnitId = __DEV__ 
        ? TestIds.REWARDED 
        : Platform.select({
            ios: 'ca-app-pub-3486145054830108/7527526800',
            android: 'ca-app-pub-3486145054830108/3753903590',
          }) || TestIds.REWARDED;

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
          this.isLoading = false;
        }
      );

      const unsubscribeEarned = this.rewardedInterstitial.addAdEventListener(
        RewardedAdEventType.EARNED_REWARD,
        async (reward: any) => {
          console.log('🎉 AdMob: User earned reward:', reward);
          await this.handleRewardEarned(reward);
        }
      );

      // Add error listener
      const unsubscribeError = this.rewardedInterstitial.addAdEventListener(
        'error',
        (error: any) => {
          console.error('❌ Ad Error Event:', error);
          this.adReady = false;
          this.isLoading = false;
        }
      );

      // Add closed listener
      const unsubscribeClosed = this.rewardedInterstitial.addAdEventListener(
        'closed',
        () => {
          console.log('📱 Ad closed by user');
          this.adReady = false;
          // Reload next ad
          setTimeout(() => {
            if (this.currentUserId) {
              this.loadRewardedAd(this.currentUserId);
            }
          }, 1000);
        }
      );

      // Load the ad
      console.log('📡 Starting ad load request...');
      
      try {
        await this.rewardedInterstitial.load();
        console.log('📡 Ad load request sent (waiting for LOADED event)...');
      } catch (loadError: any) {
        console.error('❌ Ad load() failed:', loadError);
        console.error('Load error message:', loadError?.message);
        this.adReady = false;
        
        // Common ad load errors
        if (loadError?.message?.includes('NO_FILL')) {
          console.log('ℹ️ No ad inventory available - this is normal for new apps');
        } else if (loadError?.message?.includes('NETWORK_ERROR')) {
          console.log('ℹ️ Network error - check internet connection');
        }
      }
      
    } catch (error: any) {
      console.error('❌❌❌ AdMob initialization error:', error);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      this.isLoading = false;
      this.adReady = false;
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