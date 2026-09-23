import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLanguageStore } from '../src/store/languageStore';
import { privacyPolicy } from '../src/constants/privacy';
import AppHeader from '../src/components/AppHeader';
import { theme } from '../src/theme/tokens';

const LOGO_URI = 'https://customer-assets.emergentagent.com/job_6d67ebdc-f06e-4f07-9190-b403aee951d6/artifacts/qob3yald_icon.png';

export default function PrivacyScreen() {
  const { language } = useLanguageStore();

  const policy = privacyPolicy[language as keyof typeof privacyPolicy] || privacyPolicy.en;

  return (
    <View style={styles.container}>
      <AppHeader
        variant="gold"
        logoUri={LOGO_URI}
        showDivider
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.termsText}>{policy}</Text>
      </ScrollView>
    </View>
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
