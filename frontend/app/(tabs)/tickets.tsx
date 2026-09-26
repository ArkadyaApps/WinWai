import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useUserStore } from '../../src/store/userStore';
import { useLanguageStore } from '../../src/store/languageStore';
import { translations } from '../../src/utils/translations';
import { rewardedAdManager } from '../../src/managers/RewardedAdManager';
import api from '../../src/utils/api';
import BannerAdComponent from '../../src/components/BannerAd';
import AppHeader from '../../src/components/AppHeader';
import { theme } from '../../src/theme/tokens';
import * as Haptics from 'expo-haptics';
import { ScreenFade } from '../../src/components/FadeInView';
import { LinearGradient } from 'expo-linear-gradient';
import WwIcon from '../../src/components/ui/WwIcon';
import AnimatedNumber from '../../src/components/ui/AnimatedNumber';
import { GlyphField } from '../../src/components/landing/AuroraBackground';
import Reveal from '../../src/components/landing/Reveal';

const LOGO_URI = '/logo.png';

export default function TicketsScreen() {
  const { user, updateTickets } = useUserStore();
  const { language } = useLanguageStore();
  const t = translations[language];
  const [adReady, setAdReady] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      // Set up reward callback
      rewardedAdManager.setRewardCallback(async () => {
        try {
          const response = await api.get('/api/users/me/tickets');
          updateTickets(response.data.tickets);
          if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) { 
          console.error('Failed to refresh tickets:', error); 
        }
      });
      
      // Auto-load the first ad when component mounts
      rewardedAdManager.loadRewardedAd(user.id);
    }
    
    // Check ad status periodically
    const interval = setInterval(() => { 
      try {
        const ready = rewardedAdManager.isRewardedAdReady(); 
        setAdReady(ready);
      } catch (error) {
        setAdReady(false);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [user]);

  const handleWatchAd = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      if (Platform.OS !== 'web') await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Show the ad if ready
      if (adReady) {
        await rewardedAdManager.showRewardedAd();
      } else {
        // If ad not ready yet, try loading and waiting
        await rewardedAdManager.loadRewardedAd(user.id);
        // Wait for ad to load (max 3 seconds)
        let attempts = 0;
        while (!rewardedAdManager.isRewardedAdReady() && attempts < 30) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
        if (rewardedAdManager.isRewardedAdReady()) {
          await rewardedAdManager.showRewardedAd();
        }
      }
    }
    catch (error) { console.error('Failed to show ad:', error); }
    finally { setLoading(false); }
  };

  return (
    <ScreenFade style={styles.container}>
      <AppHeader variant="emerald" logoUri={LOGO_URI} showDivider />
      <ScrollView contentContainerStyle={styles.content}>
        <Reveal style={styles.balanceWrap}>
          <View style={styles.balanceShell}>
            <LinearGradient colors={['#FFE680', '#FFC200']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.balanceCard}>
              <GlyphField color="#FFFFFF" rise={170} />
              <Text style={styles.balanceLabel}>{t.yourTicketBalance}</Text>
              <View style={styles.balanceRow}>
                <View style={styles.balanceIconDisc}>
                  <WwIcon name="ticket" size={34} color="#7A5C00" strokeWidth={1.4} />
                </View>
                <AnimatedNumber value={user?.tickets || 0} style={styles.balanceAmount} />
              </View>
              <Text style={styles.balanceSubtext}>{t.ticketsAvailable}</Text>
            </LinearGradient>
          </View>
        </Reveal>

        <View style={styles.earnSection}>
          <Text style={styles.sectionTitle}>{t.earnMoreTickets}</Text>
          <TouchableOpacity style={[styles.playButton, loading && styles.playButtonDisabled]} onPress={handleWatchAd} disabled={loading} activeOpacity={0.8}>
            {loading ? (
              <View style={styles.playButtonContent}><ActivityIndicator color="#ffffff" size="large" /><Text style={styles.playButtonTextLoading}>Loading ad...</Text></View>
            ) : (
              <View style={styles.playButtonContent}>
                <View style={styles.playIconContainer}><WwIcon name="play" size={30} color="#FFFFFF" strokeWidth={1.5} /></View>
                <View style={styles.playButtonTextContainer}>
                  <Text style={styles.playButtonTitle}>{t.watchAdPlus1 || 'Watch Ad for 1 Ticket'}</Text>
                  <Text style={styles.playButtonSubtitle}>{adReady ? 'Ad ready! Tap to watch' : 'Loading ad...'}</Text>
                </View>
              </View>
            )}
          </TouchableOpacity>

          {!adReady && (<Text style={styles.adStatusText}>{t.adLoading}</Text>)}

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>{t.howToEarnTickets}</Text>
            <View style={styles.infoItem}><WwIcon name="play" size={20} color="#2C3E50" strokeWidth={1.5} /><Text style={styles.infoText}>{t.watchRewardedAds}</Text></View>
            <TouchableOpacity style={styles.infoItem} onPress={() => require('expo-router').router.push('/referral')}>
              <WwIcon name="users" size={20} color="#2C3E50" strokeWidth={1.5} />
              <Text style={[styles.infoText, styles.infoTextLink]}>{t.referFriends}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.usageSection}><Text style={styles.sectionTitle}>{t.ticketUsage}</Text><Text style={styles.usageText}>{t.ticketUsageDescription}</Text></View>
      </ScrollView>
      <BannerAdComponent position="bottom" />
    </ScreenFade>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.cloud },
  content: { padding: 16, paddingBottom: 80 },
  balanceWrap: { marginBottom: 24 },
  balanceShell: { padding: 5, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.6)', borderWidth: 1, borderColor: 'rgba(44,62,80,0.07)' },
  balanceCard: { padding: 30, borderRadius: 27, alignItems: 'center', overflow: 'hidden', ...Platform.select({ web: { boxShadow: '0 28px 50px -26px rgba(224,168,0,0.9)' } as any, default: {} }) },
  balanceIconDisc: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.55)', alignItems: 'center', justifyContent: 'center' },
  balanceLabel: { fontSize: 16, color: '#000', fontWeight: '600', marginBottom: 12 },
  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  balanceAmount: { fontSize: 64, fontWeight: '800', color: '#000' },
  balanceSubtext: { fontSize: 14, color: '#666' },
  earnSection: { marginBottom: 24 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: theme.colors.onyx, marginBottom: 16 },
  playButton: { backgroundColor: theme.colors.magenta, padding: 24, borderRadius: 16, marginBottom: 16 },
  playButtonDisabled: { backgroundColor: '#B0B0B0' },
  playButtonContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16 },
  playIconContainer: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  playIcon: { fontSize: 28, color: '#fff', marginLeft: 4 },
  playButtonTextContainer: { flex: 1 },
  playButtonTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 4 },
  playButtonSubtitle: { fontSize: 14, color: 'rgba(255, 255, 255, 0.9)', fontWeight: '600' },
  playButtonTextLoading: { fontSize: 18, fontWeight: '700', color: '#fff', marginTop: 8 },
  adStatusText: { fontSize: 13, color: theme.colors.slate, textAlign: 'center', marginBottom: 16, paddingHorizontal: 16, lineHeight: 18 },
  infoCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12 },
  infoTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.onyx, marginBottom: 12 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  infoBullet: { fontSize: 20 },
  infoText: { fontSize: 14, color: '#555', flex: 1 },
  infoTextLink: { color: theme.colors.primaryGold, fontWeight: '600', textDecorationLine: 'underline' },
  usageSection: { backgroundColor: '#fff', padding: 16, borderRadius: 12 },
  usageText: { fontSize: 14, color: theme.colors.slate, lineHeight: 20 },
});
