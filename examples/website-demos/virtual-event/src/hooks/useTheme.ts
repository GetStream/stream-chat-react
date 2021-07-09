import { useEffect, useState } from 'react';

type ColorVariables =
  | '--primary-accent'
  | '--app-canvas'
  | '--text-high-emphasis'
  | '--text-mid-emphasis'
  | '--text-low-emphasis'
  | '--text-self'
  | '--text-pressed'
  | '--card-background'
  | '--card-alt-background'
  | '--card-self-bg'
  | '--stroke'
  | '--stroke-low-emphasis'
  | '--shadow';

type Themes = Record<ThemeOptions, Record<ModeOptions, Partial<Record<ColorVariables, string>>>>;

const themes: Themes = {
  default: {
    light: {
      '--primary-accent': '#006cff',
      '--app-canvas': '#ffffff',
      '--text-high-emphasis': '#0e1621',
      '--text-mid-emphasis': '#8a898e',
      '--text-low-emphasis': '#b2b1b5',
      '--text-self': '#ffffff',
      '--text-pressed': '#ffffff',
      '--card-background': '#f2f2f2',
      '--card-alt-background': '#ffffff',
      '--card-self-bg': '#41affc',
      '--stroke': '#e5e5e6',
      '--stroke-low-emphasis': '#f2f2f2',
      '--shadow': '0px 2px 5px rgba(0, 0, 0, 0.15)',
    },
    dark: {
      '--primary-accent': '#006cff',
      '--app-canvas': '#0e1723',
      '--text-high-emphasis': '#ffffff',
      '--text-mid-emphasis': '#868b91',
      '--text-low-emphasis': '#57606b',
      '--text-self': '#ffffff',
      '--text-pressed': '#ffffff',
      '--card-background': '#152438',
      '--card-alt-background': '#0e1723',
      '--card-self-bg': '#69727d',
      '--stroke': '#1b2d46',
      '--stroke-low-emphasis': '#1a232e',
      '--shadow': '0px 4px 4px rgba(0, 0, 0, 0.15)',
    },
  },
  social: {
    light: { '--primary-accent': '#0283ff' },
    dark: { '--primary-accent': '#0283ff' },
  },
  livestream: {
    light: { '--primary-accent': '#19a0ff' },
    dark: { '--primary-accent': '#0d47d9' },
  },
  support: {
    light: { '--primary-accent': '#005fff' },
    dark: { '--primary-accent': '#004ccc' },
  },
  team: {
    light: { '--primary-accent': '#4e1d9d' },
    dark: { '--primary-accent': '#5d02f0' },
  },
  music: {
    light: { '--primary-accent': '#f9243d' },
    dark: { '--primary-accent': '#57b560' },
  },
};

export type ModeOptions = 'light' | 'dark';
export type ThemeOptions = 'default' | 'social' | 'livestream' | 'support' | 'team' | 'music';

export const useTheme = () => {
  const [mode, setMode] = useState<ModeOptions>('light');
  const [theme, setTheme] = useState<ThemeOptions>('default');

  useEffect(() => {
    const palette = themes[theme][mode];

    for (const [key, value] of Object.entries(palette)) {
      document.documentElement.style.setProperty(key, value);
    }
  }, [mode, theme]);

  return { setMode, setTheme };
};
