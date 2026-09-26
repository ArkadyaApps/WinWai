import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleProp, ViewStyle } from 'react-native';

interface BobProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  distance?: number;
}

/** Gentle endless up-and-down float, for empty-state illustrations. */
const Bob: React.FC<BobProps> = ({ children, style, distance = 8 }) => {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(t, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: Platform.OS !== 'web' }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);
  return <Animated.View style={[style, { transform: [{ translateY: t.interpolate({ inputRange: [0, 1], outputRange: [0, -distance] }) }] }]}>{children}</Animated.View>;
};

export default Bob;
