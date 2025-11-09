import { Platform } from 'react-native';

export const AdUnits = {
  banner: {
    android: 'ca-app-pub-3486145054830108/7932273019',
    ios: 'ca-app-pub-3486145054830108/3199369828',
  },
  rewarded: {
    android: 'ca-app-pub-3486145054830108/3753903590',
    ios: 'ca-app-pub-3486145054830108/9341557600',
  },
  interstitial: {
    android: 'ca-app-pub-3486145054830108/1654639270',
    ios: 'ca-app-pub-3486145054830108/5386000722',
  },
};

export const getAdUnit = (adType: 'banner' | 'rewarded' | 'interstitial'): string => {
  return AdUnits[adType][Platform.OS as 'android' | 'ios'];
};