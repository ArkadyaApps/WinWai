import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { useUserStore } from '../src/store/userStore';

export default function Index() {
  const router = useRouter();
  const { signIn, isLoading: authLoading } = useAuth();
  const { isAuthenticated, isLoading: userLoading } = useUserStore();

  useEffect(() => {
    if (!userLoading && isAuthenticated) {
      router.replace('/(tabs)/home');
    }
  }, [isAuthenticated, userLoading]);

  const handleSignIn = async () => {
    try {
      await signIn();
      router.replace('/(tabs)/home');
    } catch (error) {
      console.error('Sign in error:', error);
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
    <View style={styles.container}>
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
        
        <TouchableOpacity 
          style={styles.button}
          onPress={handleSignIn}
          disabled={authLoading}
        >
          {authLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Sign in with Google</Text>
          )}
        </TouchableOpacity>
        
        <Text style={styles.disclaimer}>
          Watch ads to earn free raffle tickets!
        </Text>
      </View>
    </View>
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
    width: 150,
    height: 150,
    marginBottom: 24,
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    color: '#FFD700',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
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