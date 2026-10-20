import type { Hsv } from './types';

/** The shader math the Canvas renderers run on the CPU, once per frame. */

export const mix = (a: number, b: number, t: number) => a + (b - a) * t;

export const fract = (x: number) => x - Math.floor(x);

export const clamp = (x: number, low: number, high: number) =>
  Math.min(Math.max(x, low), high);

/** GLSL's smoothstep, evaluated the same with its edges either way round. */
export const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

/** HSV, hue a fraction of a turn, into `out` as RGB. */
export const hsvToRgb = (
  hue: number,
  saturation: number,
  value: number,
  out: number[],
) => {
  for (let i = 0; i < 3; i++) {
    const k = i === 0 ? 1 : i === 1 ? 2 / 3 : 1 / 3;
    const p = Math.abs(fract(hue + k) * 6 - 3);
    out[i] = value * mix(1, clamp(p - 1, 0, 1), saturation);
  }
};

/** A palette color as is; dark mode lifts saturation a touch so it stays vivid on black. */
export const vivid = (color: Hsv, dark: number, out: number[]) =>
  hsvToRgb(color.hue, clamp(color.saturation + dark * 0.06, 0, 1), color.value, out);

/** Pushes `c` away from its luminance by `amount`; below 1 desaturates. */
export const saturate = (c: number[], amount: number) => {
  const l = 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
  for (let i = 0; i < 3; i++) c[i] = clamp(mix(l, c[i], amount), 0, 1);
};

const gradient = (i: number, seed: number) =>
  fract(Math.sin(i * 127.1 + seed * 311.7) * 43758.547) * 2 - 1;

/** Smooth 1-D gradient noise from -1 to 1: the slow wobble the CPU needs, where the shader uses simplex. */
export const noise = (x: number, seed: number) => {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return mix(gradient(i, seed) * f, gradient(i + 1, seed) * (f - 1), u) * 2;
};

/** How much the agent is talking, 0 to 1: a slow phrase gate times a faster syllable wobble. */
export const speechEnv = (t: number) => {
  const gate = smoothstep(-0.25, 0.35, noise(t * 0.6, 21));
  const syllable = 0.55 + 0.45 * noise(t * 3, 5);
  return clamp(gate * syllable, 0, 1);
};

/** `expressivity` from 0 to 2; one that is not a number gets the default, 1. */
export const expressivityInput = (expressivity: number | undefined) =>
  typeof expressivity === 'number' && Number.isFinite(expressivity)
    ? clamp(expressivity, 0, 2)
    : 1;

/** `level` from 0 to 1; one that is not a number counts as no live audio, so it can't stall the motion. */
export const audioLevelInput = (level: number | null | undefined) =>
  typeof level === 'number' && Number.isFinite(level) ? clamp(level, 0, 1) : null;
