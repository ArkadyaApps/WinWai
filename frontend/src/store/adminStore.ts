import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AdminState {
  adminMode: boolean;
  setAdminMode: (mode: boolean) => Promise<void>;
  initializeAdminMode: () => Promise<void>;
}

export const useAdminStore = create<AdminState>((set) => ({
  adminMode: false,
  setAdminMode: async (adminMode) => {
    await AsyncStorage.setItem('admin_mode', adminMode.toString());
    set({ adminMode });
  },
  initializeAdminMode: async () => {
    try {
      const saved = await AsyncStorage.getItem('admin_mode');
      if (saved) {
        set({ adminMode: saved === 'true' });
      }
    } catch (error) {
      console.error('Failed to load admin mode:', error);
    }
  },
}));