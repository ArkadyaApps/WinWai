import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import * as Font from 'expo-font';
import { theme, Theme } from './tokens';

const ThemeContext = createContext<{ theme: Theme; fontsReady: boolean }>({ theme, fontsReady: true });

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [fontsReady, setFontsReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const fontMap: Record<string, any> = {};
        
        try {
          fontMap['Inter'] = require('../assets/fonts/Inter-Regular.ttf');
          fontMap['Inter-SemiBold'] = require('../assets/fonts/Inter-SemiBold.ttf');
          fontMap['Inter-Bold'] = require('../assets/fonts/Inter-Bold.ttf');
          fontMap['Prompt'] = require('../assets/fonts/Prompt-Regular.ttf');
          fontMap['Prompt-SemiBold'] = require('../assets/fonts/Prompt-SemiBold.ttf');
          fontMap['Prompt-Bold'] = require('../assets/fonts/Prompt-Bold.ttf');
        } catch (requireError) {
          console.log('Font files not found, using system fonts');
          setFontsReady(true);
          return;
        }

        await Font.loadAsync(fontMap);
      } catch (e) {
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
