import React from 'react';
import Head from 'expo-router/head';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLanguageStore } from '../src/store/languageStore';
import { termsAndConditions } from '../src/constants/terms';
import AppHeader from '../src/components/AppHeader';
import { theme } from '../src/theme/tokens';

const LOGO_URI = '/icon-192.png';

export default function TermsScreen() {
  const { language } = useLanguageStore();
  
  // Get terms based on language, fallback to English
  const terms = termsAndConditions[language as keyof typeof termsAndConditions] || termsAndConditions.en;
  
  return (
    <>
      <Head>
        <title>Terms of Service - WinWai</title>
        <link rel="canonical" href="https://winwai.online/terms" />
      </Head>
      <View style={styles.container}>
        <AppHeader
          variant="gold"
          logoUri={LOGO_URI}
          showDivider
        />
      
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <Text style={styles.termsText}>{terms}</Text>
        </ScrollView>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  termsText: {
    fontSize: 14,
    lineHeight: 22,
    color: theme.colors.onyx,
  },
});
