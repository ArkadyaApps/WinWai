import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';

interface BannerAdComponentProps {
  position?: 'top' | 'bottom';
}

const BannerAdComponent: React.FC<BannerAdComponentProps> = ({ position = 'bottom' }) => {
  // Don't show ads on web - just return null
  if (Platform.OS === 'web') {
    return null;
  }

  // This will only execute on native platforms, where AdMob is available
  return null; // Placeholder - will be properly implemented for mobile
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    height: 60,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  topPosition: {
    bottom: undefined,
    top: 0,
    borderTopWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
});

export default BannerAdComponent;