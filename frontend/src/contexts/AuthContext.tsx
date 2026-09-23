import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import { ResponseType } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useUserStore } from '../store/userStore';
import api from '../utils/api';
import { getSecureItem, setSecureItem, deleteSecureItem } from '../utils/secureStorage';

// Required so the web/native browser-based OAuth redirect can hand control
// back to the app when it completes.
WebBrowser.maybeCompleteAuthSession();

// Must match one of the audiences the backend's /auth/google accepts.
const GOOGLE_WEB_CLIENT_ID = '581979281149-4c8cdh17nliu2v0jsr5barm6cckojhsf.apps.googleusercontent.com';

interface AuthContextType {
  signIn: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, resetToken: string, newPassword: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  signOut: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { setUser, setLoading, logout, isLoading } = useUserStore();
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [request, , promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    responseType: ResponseType.IdToken,
    scopes: ['openid', 'profile', 'email'],
  });

  useEffect(() => {
    checkExistingSession();
  }, []);

  const checkExistingSession = async () => {
    try {
      const token = await getSecureItem('session_token');
      if (token) {
        const response = await api.get('/api/auth/me');
        setUser(response.data);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Session check failed:', error);
      await deleteSecureItem('session_token');
      setLoading(false);
    }
  };

  const signIn = async () => {
    if (!request) {
      throw new Error('Google sign-in is still initializing, please try again');
    }

    const result = await promptAsync();

    if (result.type === 'cancel' || result.type === 'dismiss') {
      return; // user closed the sign-in prompt - not an error
    }
    if (result.type !== 'success') {
      throw new Error('Google sign-in failed');
    }

    const idToken = result.params?.id_token;
    if (!idToken) {
      throw new Error('No ID token received from Google');
    }

    const response = await api.post('/api/auth/google', { id_token: idToken });
    const { session_token, user } = response.data;
    await setSecureItem('session_token', session_token);
    setUser(user);
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const response = await api.post('/api/auth/email/signin', { email, password });
      const { session_token, user } = response.data;
      await setSecureItem('session_token', session_token);
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
      await setSecureItem('session_token', session_token);
      setUser(user);
    } catch (error: any) {
      console.error('Email sign up failed:', error);
      throw new Error(error.response?.data?.detail || 'Sign up failed');
    }
  };

  const forgotPassword = async (email: string): Promise<void> => {
    try {
      await api.post('/api/auth/forgot-password', { email });
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
      await api.post('/api/auth/change-password', { currentPassword, newPassword });
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
      await deleteSecureItem('session_token');
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