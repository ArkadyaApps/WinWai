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
    const redirectUrl = process.env.EXPO_PUBLIC_REDIRECT_URL || 'https://reward-raffles-1.preview.emergentagent.com';
    const authUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
    
    try {
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);
      
      if (result.type === 'success' && result.url) {
        const url = new URL(result.url);
        const hash = url.hash.substring(1);
        const params = new URLSearchParams(hash);
        const sid = params.get('session_id');
        
        if (sid) {
          const response = await api.post('/api/auth/session', { session_id: sid });
          const { session_token, user } = response.data;
          
          await AsyncStorage.setItem('session_token', session_token);
          setUser(user);
        }
      }
    } catch (error) {
      console.error('Sign in failed:', error);
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