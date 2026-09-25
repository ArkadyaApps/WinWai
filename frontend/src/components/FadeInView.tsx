import React, { useCallback, useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleProp, ViewStyle } from 'react-native';
import { useFocusEffect } from 'expo-router';

const useNativeDriver = Platform.OS !== 'web';

interface FadeInViewProps {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  /** Wait this long (ms) before starting - used to stagger list items. */
  delay?: number;
  /** How far (px) the content travels upward while fading in. */
  distance?: number;
}

/** Fades and slides its children in once, when first mounted. */
export const FadeInView: React.FC<FadeInViewProps> = ({ style, children, delay = 0, distance = 14 }) => {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.timing(progress, { toValue: 1, duration: 420, delay, easing: Easing.out(Easing.cubic), useNativeDriver });
    anim.start();
    return () => anim.stop();
  }, []);
  return (
    <Animated.View
      style={[style, { opacity: progress, transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) }] }]}
    >
      {children}
    </Animated.View>
  );
};

interface ScreenFadeProps {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/**
 * Root wrapper for a screen: replays a short fade + rise every time the screen
 * gains focus, so switching tabs or opening a page feels like a transition
 * (react-navigation's tab navigator has no built-in one, and the web stack
 * doesn't animate at all).
 */
export const ScreenFade: React.FC<ScreenFadeProps> = ({ style, children }) => {
  const progress = useRef(new Animated.Value(0)).current;
  useFocusEffect(
    useCallback(() => {
      progress.setValue(0);
      const anim = Animated.timing(progress, { toValue: 1, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver });
      anim.start();
      return () => anim.stop();
    }, [])
  );
  return (
    <Animated.View
      style={[style, { opacity: progress, transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }]}
    >
      {children}
    </Animated.View>
  );
};

export default FadeInView;
