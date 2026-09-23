import { create } from 'zustand';
import { Platform } from 'react-native';

// The native `beforeinstallprompt` event isn't in lib.dom.d.ts.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PwaInstallState {
  deferredPrompt: BeforeInstallPromptEvent | null;
  isStandalone: boolean;
  isIOS: boolean;
  initialized: boolean;
  init: () => void;
  promptInstall: () => Promise<'accepted' | 'dismissed' | 'unavailable'>;
}

function detectStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    // iOS Safari's own flag - not in the standard Navigator type.
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function detectIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
}

export const usePwaInstallStore = create<PwaInstallState>((set, get) => ({
  deferredPrompt: null,
  isStandalone: false,
  isIOS: false,
  initialized: false,

  init: () => {
    if (Platform.OS !== 'web' || get().initialized || typeof window === 'undefined') return;

    set({ initialized: true, isStandalone: detectStandalone(), isIOS: detectIOS() });

    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      set({ deferredPrompt: event as BeforeInstallPromptEvent });
    });

    window.addEventListener('appinstalled', () => {
      set({ deferredPrompt: null, isStandalone: true });
    });
  },

  promptInstall: async () => {
    const { deferredPrompt } = get();
    if (!deferredPrompt) return 'unavailable';
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    set({ deferredPrompt: null });
    return outcome;
  },
}));
