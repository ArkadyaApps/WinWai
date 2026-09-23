interface BannerAdComponentProps {
  position?: 'top' | 'bottom';
}

// Native banner ads (react-native-google-mobile-ads) were dropped along with
// the rest of AdMob when the native app was retired for the PWA. The site is
// now connected to AdSense (ca-pub-3486145054830108, script loaded in
// app/+html.tsx) - if Auto ads is enabled for winwai.online in the AdSense
// dashboard, Google places banner ads on the page automatically with no
// extra markup needed here. This stays a no-op placeholder so existing
// screens that render <BannerAdComponent /> don't need changes; if you'd
// rather have a manually-placed banner unit instead of/alongside Auto ads,
// grab that display ad unit's slot ID from AdSense and this can render a
// real <ins class="adsbygoogle"> block with it.
const BannerAdComponent = (_props: BannerAdComponentProps) => null;

export default BannerAdComponent;
