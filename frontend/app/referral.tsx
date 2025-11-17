import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Alert, Clipboard, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../src/store/userStore';
import AppHeader from '../src/components/AppHeader';
import { theme } from '../src/theme/tokens';
import { useTranslation } from '../src/i18n/useTranslation';

const LOGO_URI = 'https://customer-assets.emergentagent.com/job_prize-raffle-2/artifacts/3cr2n9os_icon.png';

export default function ReferralScreen() {
  const { user } = useUserStore();
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  
  // Generate referral code from user ID
  const referralCode = user?.id?.substring(0, 8).toUpperCase() || 'WINWAI00';
  const referralLink = `https://winwai.app/invite/${referralCode}`;
  
  const handleCopyCode = () => {
    Clipboard.setString(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    Alert.alert(t('referral.copied'), t('referral.referralCodeCopied'));
  };
  
  const handleShare = async () => {
    try {
      await Share.share({
        message: t('referral.referralShareMessage').replace('{code}', referralCode),
        title: 'Join WinWai - Free Raffle App',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };
  
  return (
    <View style={styles.container}>
      <AppHeader
        variant="gold"
        logoUri={LOGO_URI}
        showDivider
      />
      
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.iconContainer}>
            <Ionicons name="gift" size={60} color={theme.colors.primaryGold} />
          </View>
          
          <Text style={styles.title}>{t('referral.inviteGetTickets')}</Text>
          <Text style={styles.subtitle}>{t('referral.referralSubtitle')}</Text>
        </View>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('referral.yourReferralCode')}</Text>
          <View style={styles.codeContainer}>
            <Text style={styles.code}>{referralCode}</Text>
          </View>
          
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color={theme.colors.primaryGold} />
            <Text style={styles.infoText}>{t('referral.shareCodeManually')}</Text>
          </View>
          
          <TouchableOpacity style={styles.copyButton} onPress={handleCopyCode}>
            <Ionicons name={copied ? "checkmark-circle" : "copy"} size={20} color="#fff" />
            <Text style={styles.copyButtonText}>{copied ? t('referral.copied') : t('referral.copyCode')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Ionicons name="share-social" size={20} color={theme.colors.primaryGold} />
            <Text style={styles.shareButtonText}>{t('referral.shareVia')}</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.howItWorks}>
          <Text style={styles.howTitle}>{t('referral.howItWorks')}</Text>
          
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>{t('referral.shareYourLink')}</Text>
              <Text style={styles.stepText}>{t('referral.shareDescription')}</Text>
            </View>
          </View>
          
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>{t('referral.theySignUp')}</Text>
              <Text style={styles.stepText}>{t('referral.signUpDescription')}</Text>
            </View>
          </View>
          
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>{t('referral.bothGetTickets')}</Text>
              <Text style={styles.stepText}>{t('referral.bothGetDescription')}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.cloud,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 30,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF9E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.onyx,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.slate,
    textAlign: 'center',
    lineHeight: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.slate,
    marginBottom: 12,
  },
  codeContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  code: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.primaryGold,
    letterSpacing: 4,
  },
  linkContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
  },
  link: {
    fontSize: 14,
    color: theme.colors.onyx,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#4ECDC4',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  copyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFF9E6',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 2,
    borderColor: theme.colors.primaryGold,
  },
  shareButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.primaryGold,
  },
  howItWorks: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  howTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.onyx,
    marginBottom: 20,
  },
  step: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primaryGold,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onyx,
    marginBottom: 4,
  },
  stepText: {
    fontSize: 14,
    color: theme.colors.slate,
    lineHeight: 20,
  },
});
