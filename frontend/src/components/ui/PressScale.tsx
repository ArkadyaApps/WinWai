import React, { useRef } from 'react';
import { Animated, Platform, Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';

interface PressScaleProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/**
 * Pressable with physical feedback: sinks and springs back on press, and on
 * desktop lifts slightly on hover. Transform-only.
 */
const PressScale: React.FC<PressScaleProps> = ({ style, children, onPressIn, onPressOut, ...rest }) => {
  const scale = useRef(new Animated.Value(1)).current;
  const lift = useRef(new Animated.Value(0)).current;
  const native = Platform.OS !== 'web';

  const to = (v: Animated.Value, toValue: number) => Animated.spring(v, { toValue, friction: 7, tension: 180, useNativeDriver: native }).start();
  const hoverProps: any =
    Platform.OS === 'web'
      ? { onHoverIn: () => to(lift, -4), onHoverOut: () => to(lift, 0) }
      : {};

  return (
    <Pressable
      {...rest}
      {...hoverProps}
      onPressIn={(e) => {
        to(scale, 0.965);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        to(scale, 1);
        onPressOut?.(e);
      }}
      style={{ flex: 1 }}
    >
      <Animated.View style={[{ flex: 1 }, style, { transform: [{ translateY: lift }, { scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
};

export default PressScale;
