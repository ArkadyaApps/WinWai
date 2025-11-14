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
    // Use app deep link as redirect URI
    const clientId = '581979281149-4c8cdh17nliu2v0jsr5barm6cckojhsf.apps.googleusercontent.com';
    const redirectUri = 'https://winwai.up.railway.app/auth/google/callback';
    const appScheme = 'com.winwai.raffle://oauth2redirect';
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + 
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=openid email profile&` +
      `access_type=offline&` +
      `prompt=consent`;
    
    console.log('==================== GOOGLE SIGNIN START ====================');
    console.log('OAuth URL:', authUrl);
    console.log('Expecting redirect to:', appScheme);
    
    try {
      // The second parameter tells WebBrowser what URL pattern to look for when redirecting back
      const result = await WebBrowser.openAuthSessionAsync(authUrl, appScheme);
      console.log('Auth result type:', result.type);
      
      if (result.type === 'success' && result.url) {
        console.log('Success! Result URL:', result.url);
        
        // Extract authorization code from deep link URL
        const url = new URL(result.url);
        const code = url.searchParams.get('code');
        const error = url.searchParams.get('error');
        
        if (error) {
          console.error('OAuth error:', error);
          throw new Error(`OAuth failed: ${error}`);
        }
        
        console.log('Auth code extracted:', code ? 'YES' : 'NO');
        
        if (code) {
          console.log('Exchanging code for token...');
          const response = await api.post('/api/auth/google/exchange', { code });
          console.log('Backend response received');
          
          const { session_token, user } = response.data;
          
          console.log('Saving session token...');
          await AsyncStorage.setItem('session_token', session_token);
          console.log('Setting user:', user.email);
          setUser(user);
          console.log('==================== GOOGLE SIGNIN COMPLETE ====================');
        } else {
          console.error('No authorization code in redirect URL!');
          throw new Error('Failed to get Google authorization code');
        }
      } else {
        console.log('Auth cancelled or failed, result type:', result.type);
        throw new Error('Sign in was cancelled');
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