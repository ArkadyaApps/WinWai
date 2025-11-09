import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import { useUserStore } from '../store/userStore';
import api from '../utils/api';

WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
    const redirectUrl = 'https://raffleprize.preview.emergentagent.com';
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

  const signOut = async () => {
    try {
      await api.post('/api/auth/logout');
      await AsyncStorage.removeItem('session_token');
      logout();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ signIn, signOut, isLoading }}>
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