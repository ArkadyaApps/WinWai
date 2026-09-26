import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Easing,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { useUserStore } from '../src/store/userStore';
import { validateEmail } from '../src/utils/validation';
import { useTranslation } from '../src/i18n/useTranslation';
import LanguageSelector from '../src/components/LanguageSelector';
import PwaInstallModal from '../src/components/PwaInstallModal';
import PartnerInquiryModal from '../src/components/PartnerInquiryModal';
import AuroraBackground from '../src/components/landing/AuroraBackground';
import WhatIsWinWai from '../src/components/landing/WhatIsWinWai';
import PartnerAdvantages from '../src/components/landing/PartnerAdvantages';
import Reveal from '../src/components/landing/Reveal';
import WwIcon from '../src/components/ui/WwIcon';
import { SIGNUP_BONUS_ENDS_AT } from '../src/constants/promo';
import { FONT_DISPLAY } from '../src/theme/fonts';

// One combined first-visit popup (how WinWai works + install offer). Either key
// being set means it was already shown/dismissed.
const WELCOME_SEEN_KEY = 'has_seen_welcome';
const INSTALL_PROMPT_DISMISSED_KEY = 'pwa_install_prompt_dismissed';

const LOGO_URI = 'https://customer-assets.emergentagent.com/job_raffle-rewards-1/artifacts/tsv1bcjh_logo.png';

const FEATURES: { icon: 'gift' | 'ticket' | 'trophy'; key: 'raffles' | 'tickets' | 'rewards' }[] = [
  { icon: 'gift', key: 'raffles' },
  { icon: 'ticket', key: 'tickets' },
  { icon: 'trophy', key: 'rewards' },
];

export default function Index() {
  const router = useRouter();
  const { signIn, signInWithEmail, isLoading: authLoading } = useAuth();
  const { isAuthenticated, isLoading: userLoading } = useUserStore();
  const { t } = useTranslation();

  const [authMode, setAuthMode] = useState<'google' | 'email'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [showPartnerModal, setShowPartnerModal] = useState(false);

  // Hero entrance: logo drops in with a soft spring, then the tagline follows.
  const logoIn = useRef(new Animated.Value(0)).current;
  const taglineIn = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const native = Platform.OS !== 'web';
    Animated.stagger(160, [
      Animated.spring(logoIn, { toValue: 1, friction: 7, tension: 60, useNativeDriver: native }),
      Animated.timing(taglineIn, { toValue: 1, duration: 800, easing: Easing.bezier(0.32, 0.72, 0, 1), useNativeDriver: native }),
    ]).start();
  }, []);

  useEffect(() => {
    if (!userLoading && isAuthenticated) {
      router.replace('/(tabs)/home');
    }
  }, [isAuthenticated, userLoading]);

  // First landing visit: show the combined popup once, after a short delay so it
  // doesn't interrupt the initial load. The install offer inside it appears only
  // when the browser actually allows installing (or on iOS, as manual steps).
  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    Promise.all([AsyncStorage.getItem(WELCOME_SEEN_KEY), AsyncStorage.getItem(INSTALL_PROMPT_DISMISSED_KEY)]).then(([seen, dismissed]) => {
      if (!cancelled && !seen && !dismissed) timer = setTimeout(() => setShowInstallModal(true), 6000);
    });
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  const handleCloseInstallModal = () => {
    setShowInstallModal(false);
    AsyncStorage.setItem(WELCOME_SEEN_KEY, 'true');
    AsyncStorage.setItem(INSTALL_PROMPT_DISMISSED_KEY, 'true');
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await signIn();
      // Navigation will happen automatically via useEffect when isAuthenticated becomes true
      // Don't navigate manually here - let the useEffect handle it
    } catch (error) {
      console.error('Sign in error:', error);
      setError('Google sign-in failed. Please try again.');
      setLoading(false);
    }
  };

  const handleEmailSignIn = async () => {
    setError('');

    // Validation
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmail(email, password);
      router.replace('/(tabs)/home');
    } catch (error: any) {
      setError(error.message || 'Sign in failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  if (userLoading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <PwaInstallModal visible={showInstallModal} onClose={handleCloseInstallModal} withHelper />
      <PartnerInquiryModal visible={showPartnerModal} onClose={() => setShowPartnerModal(false)} />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* ---------- Hero ---------- */}
        <View style={styles.hero}>
          <AuroraBackground />
          <View style={styles.languageToggle}>
            <LanguageSelector />
          </View>

          <Animated.View
            style={{ opacity: logoIn, transform: [{ scale: logoIn.interpolate({ inputRange: [0, 1], outputRange: [0.86, 1] }) }, { translateY: logoIn.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) }] }}
          >
            <Image source={{ uri: LOGO_URI }} style={styles.logo} resizeMode="contain" />
          </Animated.View>

          <Animated.View style={{ opacity: taglineIn, transform: [{ translateY: taglineIn.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }], alignItems: 'center' }}>
            <Text style={styles.headline}>{t('landing.title')}</Text>

            <View style={styles.features}>
              {FEATURES.map((f) => (
                <View key={f.key} style={styles.featureChip}>
                  <WwIcon name={f.icon} size={18} color="#1F2D3A" strokeWidth={1.5} />
                  <Text style={styles.featureText}>{t(`landing.features.${f.key}`)}</Text>
                </View>
              ))}
            </View>

            {Date.now() < SIGNUP_BONUS_ENDS_AT.getTime() && (
              <View style={styles.promoBanner}>
                <WwIcon name="sparkle" size={18} color="#7A5C00" strokeWidth={1.5} />
                <Text style={styles.promoText}>{t('landing.freeTicketPromo')}</Text>
              </View>
            )}
          </Animated.View>
        </View>

        <View style={styles.body}>
          {/* ---------- What is WinWai ---------- */}
          <Reveal style={styles.block}>
            <WhatIsWinWai />
          </Reveal>

          {/* ---------- Sign in ---------- */}
          <Reveal style={styles.block}>
            <View style={styles.shell}>
              <View style={styles.core}>
                <View style={styles.authToggle}>
                  {(['email', 'google'] as const).map((mode) => (
                    <TouchableOpacity key={mode} style={[styles.toggleButton, authMode === mode && styles.toggleButtonActive]} onPress={() => setAuthMode(mode)}>
                      <Text style={[styles.toggleText, authMode === mode && styles.toggleTextActive]}>{t(mode === 'email' ? 'landing.emailTab' : 'landing.googleTab')}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {authMode === 'email' ? (
                  <View style={styles.formContainer}>
                    <TextInput
                      style={styles.input}
                      placeholder={t('landing.email')}
                      placeholderTextColor="#9AA5AF"
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        setError('');
                      }}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoCorrect={false}
                    />

                    <View style={styles.passwordContainer}>
                      <TextInput
                        style={styles.passwordInput}
                        placeholder={t('landing.password')}
                        placeholderTextColor="#9AA5AF"
                        value={password}
                        onChangeText={(text) => {
                          setPassword(text);
                          setError('');
                        }}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                      />
                      <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(!showPassword)} accessibilityLabel="Toggle password visibility">
                        <WwIcon name={showPassword ? 'eyeOff' : 'eye'} size={20} color="#5D6D7E" strokeWidth={1.5} />
                      </TouchableOpacity>
                    </View>

                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    <TouchableOpacity style={styles.button} onPress={handleEmailSignIn} disabled={loading} activeOpacity={0.9}>
                      {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.buttonText}>{t('landing.signIn')}</Text>}
                    </TouchableOpacity>

                    <View style={styles.linkContainer}>
                      <TouchableOpacity onPress={() => router.push('/signup')}>
                        <Text style={styles.link}>{t('landing.createAccount')}</Text>
                      </TouchableOpacity>
                      <Text style={styles.linkSeparator}>•</Text>
                      <TouchableOpacity onPress={() => router.push('/forgot-password')}>
                        <Text style={styles.link}>{t('landing.forgotPassword')}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.formContainer}>
                    <TouchableOpacity style={styles.button} onPress={handleGoogleSignIn} disabled={authLoading} activeOpacity={0.9}>
                      {authLoading ? <ActivityIndicator color="#000" /> : <Text style={styles.buttonText}>{t('landing.signInWithGoogle')}</Text>}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </Reveal>

          {/* ---------- For businesses ---------- */}
          <View style={styles.block}>
            <PartnerAdvantages onBecomePartner={() => setShowPartnerModal(true)} />
          </View>

          <Text style={styles.disclaimer}>{t('landing.disclaimer')}</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFBF0' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  scrollContent: { flexGrow: 1, paddingBottom: 48 },

  hero: {
    minHeight: 470,
    paddingTop: Platform.OS === 'ios' ? 64 : 52,
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
    overflow: 'hidden',
  },
  languageToggle: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 16, right: 16, zIndex: 10 },
  logo: { width: 300, maxWidth: '86%', height: 150, marginTop: 24 },
  headline: {
    fontFamily: FONT_DISPLAY,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '800',
    color: '#1F2D3A',
    textAlign: 'center',
    letterSpacing: -0.8,
    marginTop: 8,
    maxWidth: 360,
  },
  features: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 20 },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(44,62,80,0.08)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  featureText: { fontFamily: FONT_DISPLAY, fontSize: 12, fontWeight: '700', color: '#1F2D3A' },
  promoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF3C4',
    borderWidth: 1,
    borderColor: 'rgba(255,194,0,0.6)',
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 16,
    marginTop: 18,
    maxWidth: 360,
  },
  promoText: { flexShrink: 1, fontFamily: FONT_DISPLAY, fontSize: 13, fontWeight: '700', color: '#7A5C00', textAlign: 'center' },

  body: { alignItems: 'center', paddingHorizontal: 20, gap: 64, marginTop: -8 },
  block: { width: '100%', maxWidth: 420, alignItems: 'center' },

  // nested "bezel" card for the sign-in form
  shell: { width: '100%', padding: 6, borderRadius: 34, backgroundColor: 'rgba(255,255,255,0.55)', borderWidth: 1, borderColor: 'rgba(44,62,80,0.07)' },
  core: {
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    padding: 22,
    alignItems: 'center',
    ...Platform.select({ web: { boxShadow: '0 30px 60px -32px rgba(31,45,58,0.35), inset 0 1px 1px rgba(255,255,255,0.9)' } as any, default: {} }),
  },
  authToggle: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 999, padding: 4, marginBottom: 20 },
  toggleButton: { paddingHorizontal: 30, paddingVertical: 9, borderRadius: 999 },
  toggleButtonActive: { backgroundColor: '#FFD700' },
  toggleText: { fontFamily: FONT_DISPLAY, fontSize: 14, fontWeight: '700', color: '#5D6D7E' },
  toggleTextActive: { color: '#000' },
  formContainer: { width: '100%' },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(44,62,80,0.10)',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(44,62,80,0.10)',
    marginBottom: 12,
  },
  passwordInput: { flex: 1, paddingHorizontal: 16, paddingVertical: 15, fontSize: 16 },
  eyeButton: { paddingHorizontal: 14, paddingVertical: 12 },
  errorText: { color: '#E5484D', fontSize: 14, marginBottom: 12, textAlign: 'center' },
  button: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
    marginTop: 4,
    ...Platform.select({ web: { boxShadow: '0 16px 28px -14px rgba(224,168,0,0.75)' } as any, default: {} }),
  },
  buttonText: { fontFamily: FONT_DISPLAY, color: '#000', fontSize: 17, fontWeight: '800' },
  linkContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16, gap: 8 },
  link: { fontFamily: FONT_DISPLAY, color: '#1F6FEB', fontSize: 14, fontWeight: '700' },
  linkSeparator: { color: '#9AA5AF', fontSize: 14 },
  disclaimer: { fontFamily: FONT_DISPLAY, fontSize: 13, color: '#8A96A1', textAlign: 'center', maxWidth: 320 },
});
