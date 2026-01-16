// Design System Tokens for TryOn.AI
// This file defines the core design tokens used throughout the application

export const theme = {
  // Color Palette
  colors: {
    // Primary Brand Colors
    primary: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      200: '#bae6fd',
      300: '#7dd3fc',
      400: '#38bdf8',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
      800: '#075985',
      900: '#0c4a6e',
      950: '#082f49',
    },
    
    // Secondary Brand Colors (Purple)
    secondary: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',
      600: '#9333ea',
      700: '#7c3aed',
      800: '#6b21a8',
      900: '#581c87',
      950: '#3b0764',
    },
    
    // Neutral Colors
    neutral: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
      950: '#0a0a0a',
    },
    
    // Semantic Colors
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
      950: '#052e16',
    },
    
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
      950: '#451a03',
    },
    
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
      950: '#450a0a',
    },
    
    info: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554',
    },
  },
  
  // Spacing Scale (4px base unit)
  spacing: {
    0: '0px',
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    7: '28px',
    8: '32px',
    9: '36px',
    10: '40px',
    11: '44px',
    12: '48px',
    14: '56px',
    16: '64px',
    20: '80px',
    24: '96px',
    28: '112px',
    32: '128px',
    36: '144px',
    40: '160px',
    44: '176px',
    48: '192px',
    52: '208px',
    56: '224px',
    60: '240px',
    64: '256px',
    72: '288px',
    80: '320px',
    96: '384px',
  },
  
  // Border Radius
  radius: {
    none: '0px',
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
    '2xl': '16px',
    '3xl': '24px',
    full: '9999px',
  },
  
  // Shadows
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  },
  
  // Typography
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace'],
    },
    
    fontSize: {
      xs: ['12px', { lineHeight: '16px', letterSpacing: '0.01em' }],
      sm: ['14px', { lineHeight: '20px', letterSpacing: '0.01em' }],
      base: ['16px', { lineHeight: '24px', letterSpacing: '0.01em' }],
      lg: ['18px', { lineHeight: '28px', letterSpacing: '0.01em' }],
      xl: ['20px', { lineHeight: '28px', letterSpacing: '0.01em' }],
      '2xl': ['24px', { lineHeight: '32px', letterSpacing: '-0.01em' }],
      '3xl': ['30px', { lineHeight: '36px', letterSpacing: '-0.01em' }],
      '4xl': ['36px', { lineHeight: '40px', letterSpacing: '-0.02em' }],
      '5xl': ['48px', { lineHeight: '48px', letterSpacing: '-0.02em' }],
      '6xl': ['60px', { lineHeight: '60px', letterSpacing: '-0.02em' }],
    },
    
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      extrabold: '800',
    },
  },
  
  // Gradients
  gradients: {
    primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    success: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    warning: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    error: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    info: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    
    // Brand-specific gradients
    brand: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    brandReverse: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
    brandSoft: 'linear-gradient(135deg, #e0e7ff 0%, #dbeafe 100%)',
  },
  
  // Transitions
  transitions: {
    fast: '150ms ease-in-out',
    normal: '250ms ease-in-out',
    slow: '350ms ease-in-out',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
  
  // Z-Index Scale
  zIndex: {
    hide: -1,
    auto: 'auto',
    base: 0,
    docked: 10,
    dropdown: 1000,
    sticky: 1100,
    banner: 1200,
    overlay: 1300,
    modal: 1400,
    popover: 1500,
    skipLink: 1600,
    toast: 1700,
    tooltip: 1800,
  },
} as const;

// Type exports for TypeScript
export type Theme = typeof theme;
export type ColorScale = keyof typeof theme.colors;
export type SpacingScale = keyof typeof theme.spacing;
export type RadiusScale = keyof typeof theme.radius;
export type ShadowScale = keyof typeof theme.shadows;
export type TypographyScale = keyof typeof theme.typography.fontSize;
export type FontWeightScale = keyof typeof theme.typography.fontWeight;
export type GradientScale = keyof typeof theme.gradients;
export type TransitionScale = keyof typeof theme.transitions;
export type ZIndexScale = keyof typeof theme.zIndex;

// Utility functions
export const getColor = (color: string, scale: number = 500) => {
  const [colorName, colorScale] = color.split('-');
  const scaleValue = colorScale || scale;
  return theme.colors[colorName as ColorScale]?.[scaleValue as keyof typeof theme.colors[typeof colorName]] || color;
};

export const getSpacing = (size: SpacingScale) => theme.spacing[size];
export const getRadius = (size: RadiusScale) => theme.radius[size];
export const getShadow = (size: ShadowScale) => theme.shadows[size];
export const getGradient = (name: GradientScale) => theme.gradients[name];
export const getTransition = (type: TransitionScale) => theme.transitions[type];
export const getZIndex = (level: ZIndexScale) => theme.zIndex[level];
