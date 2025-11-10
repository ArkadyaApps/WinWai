import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import * as Font from 'expo-font';
import { theme, Theme } from './tokens';

const ThemeContext = createContext<{ theme: Theme; fontsReady: boolean }>({ theme, fontsReady: true });

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [fontsReady, setFontsReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await Font.loadAsync({
          Inter: require('../assets/fonts/Inter-Regular.ttf'),
          'Inter-SemiBold': require('../assets/fonts/Inter-SemiBold.ttf'),
          'Inter-Bold': require('../assets/fonts/Inter-Bold.ttf'),
          Prompt: require('../assets/fonts/Prompt-Regular.ttf'),
          'Prompt-SemiBold': require('../assets/fonts/Prompt-SemiBold.ttf'),
          'Prompt-Bold': require('../assets/fonts/Prompt-Bold.ttf'),
        });
      } catch (e) {
        // Fallback silently
        console.log('Font load error (fallback to system):', e);
      } finally {
        setFontsReady(true);
      }
    })();
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, fontsReady }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
