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

export default function Index() {
  const router = useRouter();
  const { signIn, signInWithEmail, isLoading: authLoading } = useAuth();
  const { isAuthenticated, isLoading: userLoading } = useUserStore();
  
  const [authMode, setAuthMode] = useState<'google' | 'email'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userLoading && isAuthenticated) {
      router.replace('/(tabs)/home');
    }
  }, [isAuthenticated, userLoading]);

  const handleGoogleSignIn = async () => {
    try {
      await signIn();
      router.replace('/(tabs)/home');
    } catch (error) {
      console.error('Sign in error:', error);
      setError('Google sign-in failed. Please try again.');
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
          
          <Text style={styles.subtitle}>Win Amazing Prizes in Thailand!</Text>
          
          <View style={styles.features}>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🎁</Text>
              <Text style={styles.featureText}>Free Raffles</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🎟️</Text>
              <Text style={styles.featureText}>Earn Tickets</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🏆</Text>
              <Text style={styles.featureText}>Real Rewards</Text>
            </View>
          </View>

          {/* Auth Mode Toggle */}
          <View style={styles.authToggle}>
            <TouchableOpacity 
              style={[styles.toggleButton, authMode === 'email' && styles.toggleButtonActive]}
              onPress={() => setAuthMode('email')}
            >
              <Text style={[styles.toggleText, authMode === 'email' && styles.toggleTextActive]}>
                Email
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toggleButton, authMode === 'google' && styles.toggleButtonActive]}
              onPress={() => setAuthMode('google')}
            >
              <Text style={[styles.toggleText, authMode === 'google' && styles.toggleTextActive]}>
                Google
              </Text>
            </TouchableOpacity>
          </View>

          {authMode === 'email' ? (
            <View style={styles.formContainer}>
              <TextInput
                style={styles.input}
                placeholder="Email"
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
                  placeholder="Password"
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
                  <Text style={styles.buttonText}>Sign In</Text>
                )}
              </TouchableOpacity>

              <View style={styles.linkContainer}>
                <TouchableOpacity onPress={() => router.push('/signup')}>
                  <Text style={styles.link}>Create Account</Text>
                </TouchableOpacity>
                <Text style={styles.linkSeparator}>•</Text>
                <TouchableOpacity onPress={() => router.push('/forgot-password')}>
                  <Text style={styles.link}>Forgot Password?</Text>
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
                  <Text style={styles.buttonText}>Sign in with Google</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
          
          <Text style={styles.disclaimer}>
            Watch ads to earn free raffle tickets!
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logo: {
    width: '80%',
    height: 200,
    marginBottom: 32,
  },
  subtitle: {
    fontSize: 18,
    color: '#555',
    marginBottom: 48,
    textAlign: 'center',
  },
  features: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 48,
  },
  featureItem: {
    alignItems: 'center',
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
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
    minWidth: 250,
    alignItems: 'center',
  },
  buttonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '700',
  },
  disclaimer: {
    marginTop: 24,
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
  },
});