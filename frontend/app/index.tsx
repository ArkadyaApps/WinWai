import React, { useEffect, useState } from 'react';
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
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { useUserStore } from '../src/store/userStore';
import { validateEmail, validatePassword } from '../src/utils/validation';
import { useTranslation } from '../src/i18n/useTranslation';
import { getUserLocation } from '../src/utils/locationService';
import { useLanguageStore } from '../src/store/languageStore';
import { getLanguageFromCountry } from '../src/utils/translations';

export default function Index() {
  const router = useRouter();
  const { signIn, signInWithEmail, isLoading: authLoading } = useAuth();
  const { isAuthenticated, isLoading: userLoading } = useUserStore();
  const { t } = useTranslation();
  const { setLanguage } = useLanguageStore();
  
  const [authMode, setAuthMode] = useState<'google' | 'email'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Language detection moved to home page to avoid blocking login

  useEffect(() => {
    if (!userLoading && isAuthenticated) {
      router.replace('/(tabs)/home');
    }
  }, [isAuthenticated, userLoading]);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await signIn();
      // Navigate immediately after successful sign-in
      router.replace('/(tabs)/home');
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
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Image
            source={{ uri: 'https://customer-assets.emergentagent.com/job_raffle-rewards-1/artifacts/tsv1bcjh_logo.png' }}
            style={styles.logo}
            resizeMode="contain"
          />
          
          <Text style={styles.subtitle}>{t('landing.title')}</Text>
          
          <View style={styles.features}>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🎁</Text>
              <Text style={styles.featureText}>{t('landing.features.raffles')}</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🎟️</Text>
              <Text style={styles.featureText}>{t('landing.features.tickets')}</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🏆</Text>
              <Text style={styles.featureText}>{t('landing.features.rewards')}</Text>
            </View>
          </View>

          {/* Auth Mode Toggle */}
          <View style={styles.authToggle}>
            <TouchableOpacity 
              style={[styles.toggleButton, authMode === 'email' && styles.toggleButtonActive]}
              onPress={() => setAuthMode('email')}
            >
              <Text style={[styles.toggleText, authMode === 'email' && styles.toggleTextActive]}>
                {t('landing.emailTab')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toggleButton, authMode === 'google' && styles.toggleButtonActive]}
              onPress={() => setAuthMode('google')}
            >
              <Text style={[styles.toggleText, authMode === 'google' && styles.toggleTextActive]}>
                {t('landing.googleTab')}
              </Text>
            </TouchableOpacity>
          </View>

          {authMode === 'email' ? (
            <View style={styles.formContainer}>
              <TextInput
                style={styles.input}
                placeholder={t('landing.email')}
                placeholderTextColor="#999"
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
                  placeholderTextColor="#999"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setError('');
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity 
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.eyeIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
                </TouchableOpacity>
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              
              <TouchableOpacity 
                style={styles.button}
                onPress={handleEmailSignIn}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.buttonText}>{t('landing.signIn')}</Text>
                )}
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
              <TouchableOpacity 
                style={styles.button}
                onPress={handleGoogleSignIn}
                disabled={authLoading}
              >
                {authLoading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.buttonText}>{t('landing.signInWithGoogle')}</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
          
          <Text style={styles.disclaimer}>
            {t('landing.disclaimer')}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8E7',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logo: {
    width: '80%',
    height: 160,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: '#555',
    marginBottom: 32,
    textAlign: 'center',
  },
  features: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 24,
  },
  featureItem: {
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  featureText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  authToggle: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 25,
    padding: 4,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleButton: {
    paddingHorizontal: 32,
    paddingVertical: 10,
    borderRadius: 20,
  },
  toggleButtonActive: {
    backgroundColor: '#FFD700',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  toggleTextActive: {
    color: '#000',
  },
  formContainer: {
    width: '100%',
    maxWidth: 350,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 12,
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
  },
  eyeButton: {
    padding: 12,
  },
  eyeIcon: {
    fontSize: 20,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '700',
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  link: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '600',
  },
  linkSeparator: {
    color: '#999',
    fontSize: 14,
  },
  disclaimer: {
    marginTop: 24,
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
  },
});