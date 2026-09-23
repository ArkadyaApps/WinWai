interface BannerAdComponentProps {
  position?: 'top' | 'bottom';
}

// Native banner ads (react-native-google-mobile-ads) were dropped along with
// the rest of AdMob when the native app was retired for the PWA. No web
// banner-ad equivalent has been wired up (only rewarded ads, via the Google
// Ad Placement API in RewardedAdManager) - this is a no-op placeholder so
// existing screens that render <BannerAdComponent /> don't need changes.
const BannerAdComponent = (_props: BannerAdComponentProps) => null;

export default BannerAdComponent;
