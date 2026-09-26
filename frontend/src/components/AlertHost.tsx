import React, { useEffect, useRef } from 'react';
import { Alert, AlertButton, Animated, Easing, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { create } from 'zustand';
import { FONT_DISPLAY } from '../theme/fonts';

// react-native-web ships Alert.alert as an empty function, so on the web every
// Alert (confirmations, errors, "sign out?") silently did nothing. This file
// replaces it with a real in-app dialog, so the ~90 existing Alert.alert calls
// work unchanged. It is patched at import time and rendered once by <AlertHost/>
// in the root layout.
interface AlertItem {
  id: number;
  title: string;
  message?: string;
  buttons: AlertButton[];
}

interface AlertQueue {
  queue: AlertItem[];
  push: (item: AlertItem) => void;
  shift: () => void;
}

const useAlertQueue = create<AlertQueue>((set) => ({
  queue: [],
  push: (item) => set((s) => ({ queue: [...s.queue, item] })),
  shift: () => set((s) => ({ queue: s.queue.slice(1) })),
}));

let nextId = 1;
if (Platform.OS === 'web') {
  (Alert as any).alert = (title: string, message?: string, buttons?: AlertButton[]) => {
    useAlertQueue.getState().push({
      id: nextId++,
      title: String(title ?? ''),
      message: message ? String(message) : undefined,
      buttons: buttons && buttons.length > 0 ? buttons : [{ text: 'OK' }],
    });
  };
}

const AlertHost: React.FC = () => {
  const current = useAlertQueue((s) => s.queue[0]);
  const shift = useAlertQueue((s) => s.shift);
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!current) return;
    progress.setValue(0);
    Animated.timing(progress, { toValue: 1, duration: 320, easing: Easing.bezier(0.32, 0.72, 0, 1), useNativeDriver: Platform.OS !== 'web' }).start();
  }, [current?.id]);

  if (Platform.OS !== 'web' || !current) return null;

  const press = (button: AlertButton) => {
    shift();
    // Run after the dialog is gone so a follow-up Alert (e.g. an error) can open cleanly.
    if (button.onPress) setTimeout(() => button.onPress && button.onPress(), 0);
  };
  const cancel = current.buttons.find((b) => b.style === 'cancel');
  const horizontal = current.buttons.length <= 2;

  return (
    <Modal visible transparent animationType="none" onRequestClose={() => press(cancel ?? current.buttons[current.buttons.length - 1])}>
      <View style={styles.overlay}>
        <Animated.View
          style={[styles.shell, { opacity: progress, transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }, { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }]}
        >
          <View style={styles.core}>
            <Text style={styles.title}>{current.title}</Text>
            {!!current.message && <Text style={styles.message}>{current.message}</Text>}
            <View style={[styles.buttons, horizontal ? styles.buttonsRow : styles.buttonsColumn]}>
              {current.buttons.map((b, i) => {
                const isCancel = b.style === 'cancel';
                const isDestructive = b.style === 'destructive';
                return (
                  <Pressable
                    key={`${b.text}-${i}`}
                    onPress={() => press(b)}
                    style={({ pressed }) => [
                      styles.button,
                      horizontal && styles.buttonFlex,
                      isCancel ? styles.buttonCancel : isDestructive ? styles.buttonDestructive : styles.buttonPrimary,
                      pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
                    ]}
                  >
                    <Text style={[styles.buttonText, isCancel ? styles.textCancel : isDestructive ? styles.textDestructive : styles.textPrimary]}>{b.text}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,32,0.48)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  shell: { width: '100%', maxWidth: 380, padding: 5, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.6)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)' },
  core: {
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    padding: 22,
    ...Platform.select({ web: { boxShadow: '0 30px 60px -20px rgba(15,23,32,0.45)' } as any, default: {} }),
  },
  title: { fontFamily: FONT_DISPLAY, fontSize: 19, fontWeight: '800', color: '#1F2D3A', textAlign: 'center' },
  message: { fontFamily: FONT_DISPLAY, fontSize: 15, lineHeight: 22, color: '#5D6D7E', textAlign: 'center', marginTop: 8 },
  buttons: { marginTop: 20, gap: 10 },
  buttonsRow: { flexDirection: 'row' },
  buttonsColumn: { flexDirection: 'column' },
  button: { paddingVertical: 13, paddingHorizontal: 18, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  buttonFlex: { flex: 1 },
  buttonPrimary: { backgroundColor: '#FFD700' },
  buttonCancel: { backgroundColor: '#F1F3F5' },
  buttonDestructive: { backgroundColor: '#FDECEC' },
  buttonText: { fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: '800' },
  textPrimary: { color: '#000' },
  textCancel: { color: '#5D6D7E' },
  textDestructive: { color: '#E5484D' },
});

export default AlertHost;
