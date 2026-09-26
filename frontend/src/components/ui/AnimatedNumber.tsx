import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleProp, Text, TextStyle } from 'react-native';

interface AnimatedNumberProps {
  value: number;
  style?: StyleProp<TextStyle>;
  duration?: number;
}

/**
 * Counts up (or down) to `value` with a soft ease, and gives the digits a small
 * "pop" whenever the value changes. Used for the ticket balance.
 */
const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ value, style, duration = 900 }) => {
  const [display, setDisplay] = useState(0);
  const shown = useRef(0);
  const pop = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const from = shown.current;
    if (from === value) return;
    const start = Date.now();
    let raf: any;
    const tick = () => {
      const p = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const next = Math.round(from + (value - from) * eased);
      shown.current = next;
      setDisplay(next);
      if (p < 1) raf = setTimeout(tick, 16);
    };
    tick();
    Animated.sequence([
      Animated.timing(pop, { toValue: 1.18, duration: 160, easing: Easing.out(Easing.quad), useNativeDriver: false }),
      Animated.spring(pop, { toValue: 1, friction: 5, useNativeDriver: false }),
    ]).start();
    return () => clearTimeout(raf);
  }, [value]);

  return <Animated.Text style={[style, { transform: [{ scale: pop }] }]}>{display}</Animated.Text>;
};

export default AnimatedNumber;
