import { RewardedAd, RewardedAdEventType } from 'react-native-google-mobile-ads';
import { getAdUnit } from '../utils/adConfig';
import api from '../utils/api';

interface RewardEvent {
  userId: string;
  rewardType: string;
  rewardAmount: number;
  transactionId: string;
  timestamp: number;
}

class RewardedAdManager {
  private rewardedAd: RewardedAd | null = null;
  private isLoading = false;
  private currentUserId: string = '';
  private onRewardCallback?: (reward: RewardEvent) => void;

  async loadRewardedAd(userId: string): Promise<void> {
    if (this.isLoading || this.rewardedAd?.loaded) {
      this.currentUserId = userId;
      return;
    }

    this.isLoading = true;
    this.currentUserId = userId;
    const adUnitId = getAdUnit('rewarded');

    this.rewardedAd = RewardedAd.createForAdRequest(adUnitId, {
      keywords: ['gaming', 'rewards', 'entertainment'],
    });

    this.setupRewardedListeners();

    try {
      await this.rewardedAd.load();
    } catch (error) {
      console.error('Failed to load rewarded ad:', error);
      this.isLoading = false;
    }
  }

  private setupRewardedListeners(): void {
    if (!this.rewardedAd) return;

    this.rewardedAd.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => {
        console.log('Rewarded ad loaded');
        this.isLoading = false;
      }
    );

    this.rewardedAd.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      async (reward) => {
        console.log(`User earned reward: ${reward.amount} ${reward.type}`);
        
        const rewardEvent: RewardEvent = {
          userId: this.currentUserId,
          rewardType: reward.type,
          rewardAmount: reward.amount,
          transactionId: this.generateTransactionId(),
          timestamp: Date.now(),
        };

        try {
          const response = await api.post('/api/rewards/verify-ad', rewardEvent);
          this.onRewardCallback?.(rewardEvent);
          console.log('Reward verified:', response.data);
        } catch (error) {
          console.error('Failed to verify reward:', error);
        }
      }
    );

    this.rewardedAd.addAdEventListener(
      RewardedAdEventType.CLOSED,
      () => {
        console.log('Rewarded ad closed');
        this.rewardedAd = null;
        this.loadRewardedAd(this.currentUserId);
      }
    );
  }

  async showRewardedAd(): Promise<void> {
    if (!this.rewardedAd?.loaded) {
      console.warn('Rewarded ad not loaded');
      return;
    }

    try {
      await this.rewardedAd.show();
    } catch (error) {
      console.error('Failed to show rewarded ad:', error);
    }
  }

  isRewardedAdReady(): boolean {
    return !!this.rewardedAd?.loaded;
  }

  setRewardCallback(callback: (reward: RewardEvent) => void): void {
    this.onRewardCallback = callback;
  }

  private generateTransactionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const rewardedAdManager = new RewardedAdManager();