import { Platform } from 'react-native';
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

  async loadRewardedAd(userId: string): Promise<void> {
    this.currentUserId = userId;
    // Placeholder for mobile - will work when deployed to device
    if (Platform.OS !== 'web') {
      console.log('RewardedAd will be available on mobile device');
    }
    this.adReady = false;
  }

  async showRewardedAd(): Promise<void> {
    if (Platform.OS === 'web') {
      console.warn('Ads not available on web');
      return;
    }
    console.log('Rewarded ad will show on mobile device');
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