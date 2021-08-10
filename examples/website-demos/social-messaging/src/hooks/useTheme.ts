import { useEffect, useState } from 'react';

type ColorVariables =
  | '--text-high-emphasis'
  | '--text-low-emphasis'
  | '--disabled'
  | '--borders'
  | '--input-bg'
  | '--app-bg'
  | '--bars-bg'
  | '--link-bg'
  | '--section-bg-gradient'
  | '--highlight'
  | '--overlay-light'
  | '--overlay'
  | '--overlay-dark'
  | '--overlay-android'
  | '--accent-primary'
  | '--accent-error'
  | '--accent-info'
  | '--border-top'
  | '--border-bottom'
  | '--icon-button-shadow'
  | '--modal-shadow'
  | '--background-blur';

type ModeOptions = Record<Modes, Partial<Record<ColorVariables, string>>>;

const modes: ModeOptions = {
  light: {
    '--text-high-emphasis': '#000000',
    '--text-low-emphasis': '#72767E',
    '--disabled': '#B4B7BB',
    '--borders': '#DBDDE1',
    '--input-bg': '#E9EAED',
    '--app-bg': '#F7F7F8',
    '--bars-bg': '#FFFFFF',
    '--link-bg': '#E9F2FF',
    '--section-bg-gradient': 'linear-gradient(180deg, #F7F7F8 0%, #E9EAED 100%)',
    '--highlight': '#FBF4DD',
    '--overlay-light': 'rgba(252, 252, 252, 0.9)',
    '--overlay': 'rgba(0, 0, 0, 0.2)',
    '--overlay-dark': 'rgba(0, 0, 0, 0.6)',
    '--overlay-android': 'rgba(190, 190, 190, 0.9)',
    '--accent-primary': '#006cff',
    '--accent-error': '#FF3742',
    '--accent-info': '#20E070',
    '--border-top': '0px -1px 0px #DBDDE1',
    '--border-bottom': '0px 1px 0px #DBDDE1',
    '--icon-button-shadow': '0px 2px 4px rgba(0,0,0, .25)',
    '--modal-shadow': '0px 0px 4px rgba(0,0,0, .6)',
    '--background-blur': 'blur(10pt)',
  },
  dark: {
    '--text-high-emphasis': '#FFFFFF',
    '--text-low-emphasis': '#72767E',
    '--disabled': '#4C525C',
    '--borders': '#272A30',
    '--input-bg': '#1C1E22',
    '--app-bg': '#000000',
    '--bars-bg': '#121416',
    '--link-bg': '#00193D',
    '--section-bg-gradient': 'linear-gradient(180deg, #101214 0%, #070A0D 100%)',
    '--highlight': '#302D22',
    '--overlay-light': 'rgba(252, 252, 252, 0.9)',
    '--overlay': 'rgba(0, 0, 0, 0.4)',
    '--overlay-dark': 'rgba(F, F, F, 0.6)',
    '--overlay-android': 'rgba(10, 10, 10, 0.9)',
    '--accent-primary': '#005FFF',
    '--accent-error': '#FF3742',
    '--accent-info': '#20E070',
    '--border-top': '0px -1px 0px #272A30',
    '--border-bottom': '0px 1px 0px #272A30',
    '--icon-button-shadow': '0px 2px 4px rgba(0,0,0, .5)',
    '--modal-shadow': '0px 0px 8px rgba(0,0,0, 1)',
    '--background-blur': 'blur(10pt)',
  },
};

export type Modes = 'light' | 'dark';

export const useTheme = () => {
  const [mode, setMode] = useState<Modes>('light');

  useEffect(() => {
    const palette = modes[mode];

    for (const [key, value] of Object.entries(palette)) {
      document.documentElement.style.setProperty(key, value);
    }
  }, [mode]);

  return { mode, setMode };
};
