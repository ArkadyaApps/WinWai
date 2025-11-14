import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useUserStore } from '../store/userStore';
import api from '../utils/api';

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
    console.log('==================== NATIVE GOOGLE SIGNIN START ====================');
    
    try {
      // Configure Google Sign-In
      GoogleSignin.configure({
        webClientId: '581979281149-4c8cdh17nliu2v0jsr5barm6cckojhsf.apps.googleusercontent.com',
        offlineAccess: false,
      });

      // Check if Google Play Services is available
      await GoogleSignin.hasPlayServices();
      console.log('Google Play Services available');

      // Sign in with native Google Sign-In UI
      const userInfo = await GoogleSignin.signIn();
      console.log('Native sign-in successful, user:', userInfo.user.email);

      // Get the ID token
      const { idToken } = userInfo;
      if (!idToken) {
        throw new Error('No ID token received from Google');
      }

      console.log('ID token received, sending to backend...');

      // Send ID token to backend for verification and session creation
      const response = await api.post('/api/auth/google', { id_token: idToken });
      console.log('Backend response received');

      const { session_token, user } = response.data;

      console.log('Saving session token...');
      await AsyncStorage.setItem('session_token', session_token);
      console.log('Setting user:', user.email);
      setUser(user);
      console.log('==================== NATIVE GOOGLE SIGNIN COMPLETE ====================');
    } catch (error: any) {
      console.error('!!! Native Google Sign in failed:', error);
      
      // Handle specific error codes
      if (error.code === 'SIGN_IN_CANCELLED') {
        console.log('User cancelled sign in');
      } else if (error.code === 'IN_PROGRESS') {
        console.log('Sign in already in progress');
      } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        console.error('Google Play Services not available');
      }
      
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