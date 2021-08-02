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
    light: {
      '--primary-accent': '#0283ff',
      '--app-canvas': '#fcfcfc',
      '--text-high-emphasis': '#0e1621',
      '--text-mid-emphasis': '#8c8c8c',
      '--text-low-emphasis': '#b3b3b3',
      '--text-self': '#0e1621',
      '--text-pressed': '#ffffff',
      '--card-background': '#ffffff',
      '--card-alt-background': '#f7f7f8',
      '--card-self-bg': '#ebebeb',
      '--stroke': '#d6d6d6',
      '--stroke-low-emphasis': '#ebebeb',
      '--shadow': '0px 2px 5px rgba(0, 0, 0, 0.15)',
    },
    dark: {
      '--primary-accent': '#0283ff',
      '--app-canvas': '#282a2d',
      '--text-high-emphasis': '#e8e8e9',
      '--text-mid-emphasis': '#898a8b',
      '--text-low-emphasis': '#626262',
      '--text-self': '#e8e8e9',
      '--text-pressed': '#e8e8e9',
      '--card-background': '#3e4042',
      '--card-alt-background': '#2d2e2f',
      '--card-self-bg': '#1a1c1e',
      '--stroke': '#252628',
      '--stroke-low-emphasis': '#242424',
      '--shadow': '0px 4px 4px rgba(0, 0, 0, 0.15)',
    },
  },
  livestream: {
    light: {
      '--primary-accent': '#19a0ff',
      '--app-canvas': '#ffffff',
      '--text-high-emphasis': '#2c2c30',
      '--text-mid-emphasis': '#7ba0bb',
      '--text-low-emphasis': '#85cdff',
      '--text-self': '#2c2c30',
      '--text-pressed': '#ffffff',
      '--card-background': '#ffffff',
      '--card-alt-background': '#f1faff',
      '--card-self-bg': '#b3e0ff',
      '--stroke': '#bed5e4',
      '--stroke-low-emphasis': '#d9e1e6',
      '--shadow': '0px 2px 5px rgba(0, 0, 0, 0.15)',
    },
    dark: {
      '--primary-accent': '#0d47d9',
      '--app-canvas': '#000615',
      '--text-high-emphasis': '#ffffff',
      '--text-mid-emphasis': '#7889b6',
      '--text-low-emphasis': '#48526a',
      '--text-self': '#ffffff',
      '--text-pressed': '#ffffff',
      '--card-background': '#010c29',
      '--card-alt-background': '#00091f',
      '--card-self-bg': '#041b55',
      '--stroke': '#081e58',
      '--stroke-low-emphasis': '#041b55',
      '--shadow': '0px 4px 4px rgba(0, 0, 0, 0.15)',
    },
  },
  support: {
    light: {
      '--primary-accent': '#005fff',
      '--app-canvas': '#ffffff',
      '--text-high-emphasis': '#202a3c',
      '--text-mid-emphasis': '#6c7a93',
      '--text-low-emphasis': '#b6bece',
      '--text-self': '#2c2c30',
      '--text-pressed': '#ffffff',
      '--card-background': '#ffffff',
      '--card-alt-background': '#f5f9ff',
      '--card-self-bg': '#b3cfff',
      '--stroke': '#eaeaea',
      '--stroke-low-emphasis': '#d9e1e6',
      '--shadow': '0px 2px 5px rgba(0, 0, 0, 0.15)',
    },
    dark: {
      '--primary-accent': '#004ccc',
      '--app-canvas': '#12151b',
      '--text-high-emphasis': '#e2e5e9',
      '--text-mid-emphasis': '#afc0df',
      '--text-low-emphasis': '#43527c',
      '--text-self': '#ffffff',
      '--text-pressed': '#ffffff',
      '--card-background': '#1c1f27',
      '--card-alt-background': '#0c0e12',
      '--card-self-bg': '#072355',
      '--stroke': '#004ccc',
      '--stroke-low-emphasis': '#1c1f27',
      '--shadow': '0px 4px 4px rgba(0, 0, 0, 0.15)',
    },
  },
  team: {
    light: {
      '--primary-accent': '#4e1d9d',
      '--app-canvas': '#ffffff',
      '--text-high-emphasis': '#2e2c30',
      '--text-mid-emphasis': '#7c61a8',
      '--text-low-emphasis': '#9f8bbf',
      '--text-self': '#ffffff',
      '--text-pressed': '#ffffff',
      '--card-background': '#ffffff',
      '--card-alt-background': '#f9f5ff',
      '--card-self-bg': '#3e177e',
      '--stroke': '#eaeaea',
      '--stroke-low-emphasis': '#cccccc',
      '--shadow': '0px 2px 5px rgba(0, 0, 0, 0.15)',
    },
    dark: {
      '--primary-accent': '#5d02f0',
      '--app-canvas': '#16121b',
      '--text-high-emphasis': '#e2e5e9',
      '--text-mid-emphasis': '#c1afdf',
      '--text-low-emphasis': '#59437c',
      '--text-self': '#ffffff',
      '--text-pressed': '#ffffff',
      '--card-background': '#201c27',
      '--card-alt-background': '#0f0c12',
      '--card-self-bg': '#250755',
      '--stroke': '#4e00cc',
      '--stroke-low-emphasis': '#201c27',
      '--shadow': '0px 4px 4px rgba(0, 0, 0, 0.15)',
    },
  },
  music: {
    light: {
      '--primary-accent': '#f9243d',
      '--app-canvas': '#ffffff',
      '--text-high-emphasis': '#000000',
      '--text-mid-emphasis': '#5b5758',
      '--text-low-emphasis': '#8a898e',
      '--text-self': '#ffffff',
      '--text-pressed': '#ffffff',
      '--card-background': '#ffffff',
      '--card-alt-background': '#f7f7f7',
      '--card-self-bg': '#ea4359',
      '--stroke': '#c6c6c8',
      '--stroke-low-emphasis': '#acacac',
      '--shadow': '0px 2px 5px rgba(0, 0, 0, 0.15)',
    },
    dark: {
      '--primary-accent': '#57b560',
      '--app-canvas': '#181818',
      '--text-high-emphasis': '#ffffff',
      '--text-mid-emphasis': '#b3b3b3',
      '--text-low-emphasis': '#404040',
      '--text-self': '#ffffff',
      '--text-pressed': '#ffffff',
      '--card-background': '#282828',
      '--card-alt-background': '#121212',
      '--card-self-bg': '#000000',
      '--stroke': '#333333',
      '--stroke-low-emphasis': '#282828',
      '--shadow': '0px 4px 4px rgba(0, 0, 0, 0.15)',
    },
  },
};
