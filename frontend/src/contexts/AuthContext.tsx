import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import { useUserStore } from '../store/userStore';
import api from '../utils/api';

WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
  signIn: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<{ resetToken: string; email: string }>;
  resetPassword: (email: string, resetToken: string, newPassword: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  signOut: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { setUser, setLoading, logout, isLoading } = useUserStore();
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const token = await AsyncStorage.getItem('session_token');
      if (token) {
        const response = await api.get('/api/auth/me');
        setUser(response.data);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Session check failed:', error);
      await AsyncStorage.removeItem('session_token');
      setLoading(false);
    }
  };

  const signIn = async () => {
    // Use app's custom scheme for better in-app experience
    const clientId = '581979281149-bg4qaibj9rtgkfbffv6ogc2r83i8a13m.apps.googleusercontent.com';
    const redirectUri = 'com.winwai.raffle:/oauth2redirect'; // Using reversed package name
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + 
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=id_token&` +
      `scope=openid email profile&` +
      `nonce=${Math.random().toString(36)}`;
    
    console.log('==================== GOOGLE SIGNIN START ====================');
    console.log('Redirect URI:', redirectUri);
    console.log('Auth URL:', authUrl);
    
    try {
      console.log('Opening Google OAuth...');
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
      console.log('Auth result type:', result.type);
      
      if (result.type === 'success' && result.url) {
        console.log('Success! Result URL:', result.url);
        
        // Extract ID token from URL fragment
        const url = new URL(result.url);
        const hash = url.hash.substring(1);
        const params = new URLSearchParams(hash);
        const idToken = params.get('id_token');
        
        console.log('ID Token extracted:', idToken ? 'YES' : 'NO');
        
        if (idToken) {
          console.log('Calling backend with ID token...');
          const response = await api.post('/api/auth/google', { id_token: idToken });
          console.log('Backend response received');
          
          const { session_token, user } = response.data;
          
          console.log('Saving session token...');
          await AsyncStorage.setItem('session_token', session_token);
          console.log('Setting user:', user.email);
          setUser(user);
          console.log('==================== GOOGLE SIGNIN COMPLETE ====================');
        } else {
          console.error('No id_token in URL!');
          throw new Error('Failed to get Google ID token');
        }
      } else {
        console.log('Auth cancelled or failed, result type:', result.type);
      }
    } catch (error) {
      console.error('!!! Sign in failed:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const response = await api.post('/api/auth/email/signin', { email, password });
      const { session_token, user } = response.data;
      await AsyncStorage.setItem('session_token', session_token);
      setUser(user);
    } catch (error: any) {
      console.error('Email sign in failed:', error);
      throw new Error(error.response?.data?.detail || 'Sign in failed');
    }
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    try {
      const response = await api.post('/api/auth/email/signup', { email, password, name });
      const { session_token, user } = response.data;
      await AsyncStorage.setItem('session_token', session_token);
      setUser(user);
    } catch (error: any) {
      console.error('Email sign up failed:', error);
      throw new Error(error.response?.data?.detail || 'Sign up failed');
    }
  };

  const forgotPassword = async (email: string): Promise<{ resetToken: string; email: string }> => {
    try {
      const response = await api.post('/api/auth/forgot-password', { email });
      return {
        resetToken: response.data.resetToken,
        email: response.data.email
      };
    } catch (error: any) {
      console.error('Forgot password failed:', error);
      throw new Error(error.response?.data?.detail || 'Failed to send reset link');
    }
  };

  const resetPassword = async (email: string, resetToken: string, newPassword: string) => {
    try {
      await api.post('/api/auth/reset-password', { email, resetToken, newPassword });
    } catch (error: any) {
      console.error('Reset password failed:', error);
      throw new Error(error.response?.data?.detail || 'Failed to reset password');
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const token = await AsyncStorage.getItem('session_token');
      await api.post('/api/auth/change-password', 
        { currentPassword, newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error: any) {
      console.error('Change password failed:', error);
      throw new Error(error.response?.data?.detail || 'Failed to change password');
    }
  };

  const signOut = async () => {
    try {
      // Call logout endpoint
      await api.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with local logout even if API fails
    } finally {
      // Always clear local state regardless of API success
      await AsyncStorage.removeItem('session_token');
      logout();
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      signIn, 
      signInWithEmail, 
      signUpWithEmail, 
      forgotPassword,
      resetPassword,
      changePassword,
      signOut, 
      isLoading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};