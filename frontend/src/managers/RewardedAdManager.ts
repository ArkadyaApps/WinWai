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
  private adMobAvailable = false;

  async loadRewardedAd(userId: string): Promise<void> {
    this.currentUserId = userId;
    this.adReady = false;
    
    // Only load ads on native platforms
    if (Platform.OS === 'web') {
      return;
    }

    // Don't try to load if AdMob is not available
    if (!this.adMobAvailable && !this.checkAdMobAvailability()) {
      console.log('AdMob not available, skipping ad load');
      return;
    }

    try {
      const admob = (global as any).__admobModule;
      const RewardedInterstitialAd = admob.RewardedInterstitialAd;
      const RewardedAdEventType = admob.RewardedAdEventType;
      const TestIds = admob.TestIds;
      
      const adUnitId = __DEV__ 
        ? TestIds.REWARDED_INTERSTITIAL 
        : Platform.select({
            ios: 'ca-app-pub-3940256099942544/5224354917',
            android: 'ca-app-pub-3940256099942544/5224354917',
          }) || TestIds.REWARDED_INTERSTITIAL;

      this.rewardedInterstitial = RewardedInterstitialAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: false,
        keywords: ['game', 'raffle', 'prize', 'reward'],
      });

      // Set up event listeners
      const unsubscribeLoaded = this.rewardedInterstitial.addAdEventListener(
        RewardedAdEventType.LOADED,
        () => {
          console.log('Rewarded ad loaded successfully');
          this.adReady = true;
        }
      );

      const unsubscribeEarned = this.rewardedInterstitial.addAdEventListener(
        RewardedAdEventType.EARNED_REWARD,
        async (reward: any) => {
          console.log('User earned reward:', reward);
          await this.handleRewardEarned(reward);
        }
      );

      // Load the ad
      await this.rewardedInterstitial.load();
      
    } catch (error) {
      console.error('Failed to load rewarded ad:', error);
      this.adReady = false;
    }
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
        rewardAmount: reward.amount || 10,
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