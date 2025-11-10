/**
 * Validation utilities for email/password authentication
 */

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const passwordsMatch = (password: string, confirm: string): boolean => {
  return password === confirm && password.length > 0;
};

export const getPasswordStrength = (password: string): {
  strength: 'weak' | 'medium' | 'strong';
  label: string;
  color: string;
} => {
  if (password.length === 0) {
    return { strength: 'weak', label: '', color: '#999' };
  }
  
  if (password.length < 6) {
    return { strength: 'weak', label: 'Too short', color: '#ff4444' };
  }
  
  const hasNumbers = /\d/.test(password);
  const hasLetters = /[a-zA-Z]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const criteriaMet = [hasNumbers, hasLetters, hasSpecial].filter(Boolean).length;
  
  if (password.length >= 12 && criteriaMet >= 2) {
    return { strength: 'strong', label: 'Strong', color: '#00C853' };
  } else if (password.length >= 8 && criteriaMet >= 1) {
    return { strength: 'medium', label: 'Medium', color: '#FFB300' };
  } else {
    return { strength: 'weak', label: 'Weak', color: '#ff4444' };
  }
};
