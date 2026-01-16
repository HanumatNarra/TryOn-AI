'use client';

import React, { createContext, useContext, useEffect } from 'react';

import { theme } from './theme';

interface ThemeContextType {
  theme: typeof theme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  useEffect(() => {
    // Set CSS custom properties for design tokens
    const root = document.documentElement;
    
    // Colors
    Object.entries(theme.colors).forEach(([colorName, colorScale]) => {
      if (typeof colorScale === 'object') {
        Object.entries(colorScale).forEach(([scale, value]) => {
          root.style.setProperty(`--color-${colorName}-${scale}`, value);
        });
      }
    });
    
    // Spacing
    Object.entries(theme.spacing).forEach(([size, value]) => {
      root.style.setProperty(`--spacing-${size}`, value);
    });
    
    // Radius
    Object.entries(theme.radius).forEach(([size, value]) => {
      root.style.setProperty(`--radius-${size}`, value);
    });
    
    // Shadows
    Object.entries(theme.shadows).forEach(([size, value]) => {
      root.style.setProperty(`--shadow-${size}`, value);
    });
    
    // Typography
    Object.entries(theme.typography.fontSize).forEach(([size, config]) => {
      if (Array.isArray(config)) {
        root.style.setProperty(`--font-size-${size}`, config[0]);
        root.style.setProperty(`--line-height-${size}`, config[1].lineHeight);
        root.style.setProperty(`--letter-spacing-${size}`, config[1].letterSpacing);
      }
    });
    
    Object.entries(theme.typography.fontWeight).forEach(([weight, value]) => {
      root.style.setProperty(`--font-weight-${weight}`, value);
    });
    
    // Gradients
    Object.entries(theme.gradients).forEach(([name, value]) => {
      root.style.setProperty(`--gradient-${name}`, value);
    });
    
    // Transitions
    Object.entries(theme.transitions).forEach(([type, value]) => {
      root.style.setProperty(`--transition-${type}`, value);
    });
    
    // Z-Index
    Object.entries(theme.zIndex).forEach(([level, value]) => {
      root.style.setProperty(`--z-${level}`, String(value));
    });
    
    // Set base design tokens
    root.style.setProperty('--font-family-sans', theme.typography.fontFamily.sans.join(', '));
    root.style.setProperty('--font-family-mono', theme.typography.fontFamily.mono.join(', '));
    
  }, []);

  return (
    <ThemeContext.Provider value={{ theme }}>
      {children}
    </ThemeContext.Provider>
  );
};
