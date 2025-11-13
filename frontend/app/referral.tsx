import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Alert, Clipboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '../src/store/userStore';
import AppHeader from '../src/components/AppHeader';
import { theme } from '../src/theme/tokens';

const LOGO_URI = 'https://customer-assets.emergentagent.com/job_6d67ebdc-f06e-4f07-9190-b403aee951d6/artifacts/qob3yald_icon.png';

export default function ReferralScreen() {
  const { user } = useUserStore();
  const [copied, setCopied] = useState(false);
  
  // Generate referral code from user ID
  const referralCode = user?.id?.substring(0, 8).toUpperCase() || 'WINWAI00';
  const referralLink = `https://winwai.app/invite/${referralCode}`;
  
  const handleCopyLink = () => {
    Clipboard.setString(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    Alert.alert('Copied!', 'Referral link copied to clipboard');
  };
  
  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join WinWai and get 1 FREE ticket! Use my referral code: ${referralCode}\n\n${referralLink}`,
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
      
      <View style={styles.content}>
        <View style={styles.hero}>
          <View style={styles.iconContainer}>
            <Ionicons name="gift" size={60} color={theme.colors.primaryGold} />
          </View>
          
          <Text style={styles.title}>Invite Friends, Get Tickets!</Text>
          <Text style={styles.subtitle}>
            Share your referral link and both you and your friend get 1 free ticket when they sign up!
          </Text>
        </View>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Your Referral Code</Text>
          <View style={styles.codeContainer}>
            <Text style={styles.code}>{referralCode}</Text>
          </View>
          
          <Text style={styles.cardTitle} style={{ marginTop: 20 }}>Your Referral Link</Text>
          <View style={styles.linkContainer}>
            <Text style={styles.link} numberOfLines={1}>{referralLink}</Text>
          </View>
          
          <TouchableOpacity style={styles.copyButton} onPress={handleCopyLink}>
            <Ionicons name={copied ? "checkmark-circle" : "copy"} size={20} color="#fff" />
            <Text style={styles.copyButtonText}>
              {copied ? "Copied!" : "Copy Link"}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
            <Ionicons name="share-social" size={20} color={theme.colors.primaryGold} />
            <Text style={styles.shareButtonText}>Share via...</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.howItWorks}>
          <Text style={styles.howTitle}>How it works</Text>
          
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Share your link</Text>
              <Text style={styles.stepText}>Send your referral link to friends</Text>
            </View>
          </View>
          
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>They sign up</Text>
              <Text style={styles.stepText}>Your friend creates an account using your link</Text>
            </View>
          </View>
          
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>You both get tickets!</Text>
              <Text style={styles.stepText}>Both of you receive 1 free ticket instantly</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.cloud,
  },
  content: {
    flex: 1,
    padding: 20,
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
