import { Platform, Alert } from 'react-native';
import api from '../utils/api';

export interface RewardEvent {
  userId: string;
  rewardType: string;
  rewardAmount: number;
  transactionId: string;
  timestamp: number;
}

// Confirmed AdSense publisher id for winwai.online. The adsbygoogle.js
// script itself is loaded once, site-wide, in app/+html.tsx.
// NOTE: the account still needs to be approved for the Ad Placement API's
// rewarded-ad product for this to actually serve ads - confirm in the
// Google AdSense dashboard under Ad Placement API / Games.
const AD_CLIENT = 'ca-pub-3486145054830108';
const AD_SCRIPT_SRC = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${AD_CLIENT}`;

type AdBreakStatus = 'viewed' | 'dismissed' | 'ignored' | 'frequencyCapped' | 'noAdPreloaded' | 'other';

interface RewardPlacement {
  type: 'reward';
  name: string;
  beforeReward: (showAdFn: () => void) => void;
  adDismissed?: () => void;
  adViewed?: () => void;
  adBreakDone?: (placementInfo: { breakStatus: AdBreakStatus }) => void;
}

declare global {
  interface Window {
    adsbygoogle?: (RewardPlacement | Record<string, unknown>)[];
  }
}

class RewardedAdManager {
  private currentUserId = '';
  private onRewardCallback?: (reward: RewardEvent) => void;
  private scriptLoaded = false;
  private scriptLoadPromise: Promise<void> | null = null;

  async loadRewardedAd(userId: string): Promise<void> {
    this.currentUserId = userId;
    if (Platform.OS !== 'web' || this.scriptLoaded) return;

    try {
      await this.ensureScriptLoaded();
    } catch (error) {
      console.error('Failed to load rewarded ad script:', error);
    }
  }

  private ensureScriptLoaded(): Promise<void> {
    if (this.scriptLoadPromise) return this.scriptLoadPromise;

    this.scriptLoadPromise = new Promise((resolve, reject) => {
      // adsbygoogle's own recommended pattern: `(window.adsbygoogle =
      // window.adsbygoogle || []).push(...)` is a queue that works whether
      // or not the async script has actually finished loading yet - no need
      // to wait for a load event. app/+html.tsx already loads the script
      // site-wide (also needed for AdSense display/Auto ads), so just make
      // sure the queue array exists; only inject our own copy as a fallback
      // if that site-wide tag is somehow missing.
      window.adsbygoogle = window.adsbygoogle || [];
      this.scriptLoaded = true;

      if (document.querySelector('script[src*="adsbygoogle.js"]')) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.async = true;
      script.src = AD_SCRIPT_SRC;
      script.crossOrigin = 'anonymous';
      script.onerror = () => reject(new Error('Ad Placement script failed to load'));
      document.head.appendChild(script);
      resolve();
    });

    return this.scriptLoadPromise;
  }

  isRewardedAdReady(): boolean {
    return Platform.OS === 'web' && this.scriptLoaded;
  }

  async showRewardedAd(): Promise<void> {
    if (Platform.OS !== 'web') {
      Alert.alert('Ads Not Available', 'Rewarded ads are only available in the web app.');
      return;
    }

    try {
      await this.ensureScriptLoaded();
    } catch {
      Alert.alert('Ad Error', 'Ads are unavailable right now. Please try again later.');
      return;
    }

    return new Promise((resolve) => {
      window.adsbygoogle!.push({
        type: 'reward',
        name: 'earn-tickets',
        beforeReward: (showAdFn: () => void) => showAdFn(),
        adViewed: async () => {
          await this.handleRewardEarned();
          resolve();
        },
        adBreakDone: (placementInfo) => {
          if (placementInfo.breakStatus !== 'viewed') {
            if (placementInfo.breakStatus === 'noAdPreloaded') {
              Alert.alert('No Ad Available', 'No ad is available right now. Please try again later.');
            }
            resolve();
          }
        },
      } as RewardPlacement);
    });
  }

  private async handleRewardEarned(): Promise<void> {
    try {
      const transactionId = this.generateTransactionId();
      const rewardEvent: RewardEvent = {
        userId: this.currentUserId,
        rewardType: 'tickets',
        rewardAmount: 1,
        transactionId,
        timestamp: Date.now(),
      };

      const response = await api.post('/api/rewards/verify-ad', rewardEvent);

      if (response.data.success) {
        Alert.alert(
          '🎉 Tickets Earned!',
          `You earned ${response.data.ticketsAwarded} tickets!\nNew balance: ${response.data.newBalance} tickets`
        );
        if (this.onRewardCallback) {
          this.onRewardCallback(rewardEvent);
        }
      }
    } catch (error) {
      console.error('Failed to process reward:', error);
      Alert.alert('Error', 'Failed to credit tickets. Please contact support.');
    }
  }

  setRewardCallback(callback: (reward: RewardEvent) => void): void {
    this.onRewardCallback = callback;
  }

  private generateTransactionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const rewardedAdManager = new RewardedAdManager();
