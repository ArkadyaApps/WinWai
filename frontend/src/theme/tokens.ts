// Design tokens for WinWai
export const colors = {
  primaryGold: '#FFD700',
  primaryGoldDark: '#FFC200',
  primaryEmerald: '#0F8B6D',
  emeraldA: '#4ECDC4',
  emeraldB: '#44A08D',
  mintA: '#A8E6CF',
  mintB: '#88D8B0',
  onyx: '#2C3E50',
  slate: '#7F8C8D',
  cloud: '#F8F9FA',
  line: '#E0E0E0',
  danger: '#FF3B30',
  magenta: '#FF4081',
};

export const radii = {
  card: 12,
  pill: 24,
};

export const space = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const shadows = Platform.select({
  ios: {
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
  },
  android: {
    card: {
      elevation: 3,
    },
  },
  default: {
    card: {},
  },
});

export const gradients = {
  gold: [colors.primaryGold, colors.primaryGoldDark],
  emerald: [colors.emeraldA, colors.emeraldB],
  mint: [colors.mintA, colors.mintB],
};

export type Theme = {
  colors: typeof colors;
  radii: typeof radii;
  space: typeof space;
  shadows: typeof shadows;
  gradients: typeof gradients;
};

export const theme: Theme = {
  colors,
  radii,
  space,
  shadows: shadows as any,
  gradients,
};
