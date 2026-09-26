import React from 'react';
import { Platform } from 'react-native';

// WinWai's own hairline icon set: 24x24 grid, thin round-cap strokes, no fills.
// Drawn as inline <svg> (react-native-svg is not a dependency); the app ships as
// a web PWA, and on native these render nothing.
const PATHS = {
  ticket: ['M3.5 7.5h17v3a1.5 1.5 0 0 0 0 3v3h-17v-3a1.5 1.5 0 0 0 0-3z', 'M14.5 7.5v1.6M14.5 11.2v1.6M14.5 14.9v1.6'],
  gift: ['M4.5 11h15v8.5h-15z', 'M3.5 7.5h17V11h-17z', 'M12 7.5v12', 'M12 7.5C12 5 10.5 3.8 9 4.5S8 7.5 12 7.5z', 'M12 7.5c0-2.5 1.5-3.7 3-3s1 3-3 3z'],
  trophy: ['M8 4.5h8v5a4 4 0 0 1-8 0z', 'M8 6H5.5v1.5a3 3 0 0 0 3 3', 'M16 6h2.5v1.5a3 3 0 0 1-3 3', 'M12 13.5V17', 'M9.5 17h5', 'M8.5 19.5h7'],
  home: ['M4 11l8-6.5 8 6.5', 'M6 9.8v9.7h12V9.8', 'M10 19.5v-5h4v5'],
  user: ['M12 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z', 'M5 19.5c.8-3.3 3.6-5 7-5s6.2 1.7 7 5'],
  play: ['M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17z', 'M10.5 9v6l5-3z'],
  store: [
    'M4 9.5l1.2-4.5h13.6L20 9.5',
    'M4 9.5c0 1.4 1.1 2.3 2.7 2.3S9.3 10.9 9.3 9.5c0 1.4 1.2 2.3 2.7 2.3s2.7-.9 2.7-2.3c0 1.4 1.1 2.3 2.7 2.3S20 10.9 20 9.5',
    'M5.5 11.8v7.7h13v-7.7',
    'M10 19.5v-4h4v4',
  ],
  megaphone: ['M4 10.5v3h3l7 4v-11l-7 4z', 'M17 9.5a3.5 3.5 0 0 1 0 5', 'M7 13.5l1 4.5h2.2l-.9-3.5'],
  pin: ['M12 20.5s6-5.2 6-10a6 6 0 0 0-12 0c0 4.8 6 10 6 10z', 'M12 12.3a2.3 2.3 0 1 0 0-4.6 2.3 2.3 0 0 0 0 4.6z'],
  shield: ['M12 3.5l7 2.6v5.4c0 4.4-3 7.6-7 9-4-1.4-7-4.6-7-9V6.1z', 'M9 12l2.2 2.2L15.2 10'],
  sparkle: ['M12 3.5l1.7 5.3 5.3 1.7-5.3 1.7L12 17.5l-1.7-5.3L5 10.5l5.3-1.7z', 'M18.5 16.5l.6 1.9 1.9.6-1.9.6-.6 1.9-.6-1.9-1.9-.6 1.9-.6z'],
  chart: ['M4 19.5h16', 'M6.5 15.5l4-4 3 3 5-6', 'M15.5 8.5H19V12'],
  check: ['M5 12.5l4.5 4.5L19 7.5'],
  arrow: ['M5 12h14', 'M13.5 6.5L19 12l-5.5 5.5'],
  clock: ['M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17z', 'M12 7.5V12l3 2'],
  eye: ['M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z', 'M12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z'],
  eyeOff: ['M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z', 'M12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z', 'M4 4l16 16'],
  scan: ['M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8', 'M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8', 'M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16', 'M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16', 'M8 12h8'],
} as const;

export type WwIconName = keyof typeof PATHS;

interface WwIconProps {
  name: WwIconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

const WwIcon: React.FC<WwIconProps> = ({ name, size = 24, color = '#2C3E50', strokeWidth = 1.4 }) => {
  if (Platform.OS !== 'web') return null;
  return React.createElement(
    'svg',
    {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: color,
      strokeWidth,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      'aria-hidden': true,
      style: { display: 'block', flexShrink: 0 },
    },
    PATHS[name].map((d, i) => React.createElement('path', { key: i, d }))
  );
};

export default WwIcon;
