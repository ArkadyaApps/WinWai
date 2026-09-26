import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleProp, View, ViewStyle } from 'react-native';

// The house easing: fast start, long soft landing (a "heavy" spring feel).
export const EASE_OUT_SOFT = Easing.bezier(0.32, 0.72, 0, 1);

interface RevealProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Stagger siblings by giving each a bigger delay (ms). */
  delay?: number;
  distance?: number;
}

/**
 * Fades and rises its children into place the first time they scroll into view
 * (IntersectionObserver on web - no scroll listeners). Only transform + opacity
 * are animated. Anywhere IntersectionObserver is missing it just plays on mount.
 */
const Reveal: React.FC<RevealProps> = ({ children, style, delay = 0, distance = 28 }) => {
  const hostRef = useRef<any>(null);
  const [visible, setVisible] = useState(false);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const node = hostRef.current as Element | null;
    if (Platform.OS !== 'web' || typeof IntersectionObserver === 'undefined' || !node || !(node as any).getBoundingClientRect) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const anim = Animated.timing(progress, { toValue: 1, duration: 850, delay, easing: EASE_OUT_SOFT, useNativeDriver: Platform.OS !== 'web' });
    anim.start();
    return () => anim.stop();
  }, [visible]);

  return (
    <View ref={hostRef} style={style}>
      <Animated.View
        style={{ opacity: progress, transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) }] }}
      >
        {children}
      </Animated.View>
    </View>
  );
};

export default Reveal;
