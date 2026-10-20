import type { Hsv } from './types';

export const MAXIMUM_COLORS = 5;

type Rgb = [number, number, number];

let normalizer: CanvasRenderingContext2D | null | undefined;

/**
 * The browser's own reading of a CSS color, as `#rrggbb` or `rgba(...)`, so any syntax it
 * understands (names, `hsl()`, `color-mix()`, ...) reaches the parser below in one of two forms.
 */
const normalize = (color: string) => {
  if (normalizer === undefined) {
    normalizer =
      typeof document === 'undefined'
        ? null
        : document.createElement('canvas').getContext('2d');
  }
  if (!normalizer) return color;
  // An invalid color leaves the previous value in place, so reset first and compare.
  normalizer.fillStyle = '#000000';
  normalizer.fillStyle = color;
  return String(normalizer.fillStyle);
};

const channel = (value: string) =>
  value.trim().endsWith('%') ? parseFloat(value) / 100 : parseFloat(value) / 255;

/** Reads `#rgb`, `#rrggbb` (with optional alpha) and `rgb()`/`rgba()` into 0-1 channels. */
export const parseColor = (color: string): Rgb | null => {
  const value = normalize(color.trim()).trim().toLowerCase();
  const hex = /^#([0-9a-f]{3,8})$/.exec(value)?.[1];
  if (hex) {
    const full =
      hex.length <= 4
        ? hex
            .slice(0, 3)
            .split('')
            .map((c) => c + c)
            .join('')
        : hex.slice(0, 6);
    if (full.length !== 6) return null;
    return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255) as Rgb;
  }
  const rgb = /^rgba?\(([^)]+)\)$/.exec(value)?.[1];
  if (rgb) {
    const parts = rgb.split(/[\s,/]+/).filter(Boolean);
    if (parts.length < 3) return null;
    const channels = parts.slice(0, 3).map(channel);
    if (channels.some((c) => !Number.isFinite(c))) return null;
    return channels.map((c) => Math.min(Math.max(c, 0), 1)) as Rgb;
  }
  return null;
};

/** RGB channels from 0 to 1 as HSV, keeping full saturation and value so muted colors render true. */
export const rgbToHsv = ([r, g, b]: Rgb): Hsv => {
  const high = Math.max(r, g, b);
  const low = Math.min(r, g, b);
  const delta = high - low;
  let hue = 0;
  if (delta !== 0) {
    if (high === r) hue = ((((g - b) / delta) % 6) + 6) % 6;
    else if (high === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
  }
  return {
    hue: (((hue / 6) % 1) + 1) % 1,
    saturation: high === 0 ? 0 : Math.min(Math.max(delta / high, 0), 1),
    value: Math.min(Math.max(high, 0), 1),
  };
};

/** CSS colors as the HSV the renderers read, at most five; colors that cannot be read are skipped. */
export const toHsvPalette = (colors: readonly string[]): Hsv[] =>
  colors
    .map(parseColor)
    .filter((rgb): rgb is Rgb => rgb !== null)
    .slice(0, MAXIMUM_COLORS)
    .map(rgbToHsv);

/** Relative luminance of a CSS color, or null when it cannot be read. */
export const luminance = (color: string) => {
  const rgb = parseColor(color);
  if (!rgb) return null;
  const [r, g, b] = rgb.map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4),
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
