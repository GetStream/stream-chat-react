import { clamp, mix, saturate, vivid } from './math';
import type { Hsv, VoiceAgentState } from './types';

/*
 * The CSS glow is built the way the shader composes the glow: an opaque color field (a base and
 * the masses mixed over it in order, with smoothstep falloffs) seen through an alpha that the
 * first mass makes, 0.15 + 0.6 b0, as the shader's 0.15 + 0.6 (b0 + 0.8 b1) without its fainter
 * second term. The gradients below are what the stylesheet cannot know ahead of time: the
 * falloffs, the mask and the palette.
 */

/** R as a share of the globe's width: the globe is the soft edge, 1.06 R across each side. */
const R = 100 / 2.12;

/**
 * The four orbits, from the shader's angles: the period of a turn at playback rate 1 (2π over its
 * share of the orbit spin), its direction, starting angle and distance from the centre in R, and
 * how long a sway takes in place of the noise that wobbles it.
 */
export const ORBITS = [
  { direction: 'normal', distance: 0.4, period: 15, start: 0, sway: 8.3 },
  { direction: 'reverse', distance: 0.38, period: 18.5, start: 115, sway: 10.1 },
  { direction: 'normal', distance: 0.36, period: 21, start: 57, sway: 9.1 },
  { direction: 'reverse', distance: 0.34, period: 24, start: 200, sway: 11.3 },
] as const;

type Mass = {
  color: string;
  orbit: number;
  reach: number;
  weight?: string;
};

/** The masses in the order the shader mixes them, each reaching `reach` R. */
export const MASSES: Mass[] = [
  { color: 'var(--str-ai-glow-k0)', orbit: 0, reach: 1.15 },
  { color: 'var(--str-ai-glow-col-b)', orbit: 1, reach: 1.3 },
  { color: 'var(--str-ai-glow-col-c)', orbit: 0, reach: 1.15, weight: '0.5' },
  {
    color: 'var(--str-ai-glow-col-d)',
    orbit: 2,
    reach: 1.2,
    weight: 'var(--str-ai-glow-w3, 0)',
  },
  {
    color: 'var(--str-ai-glow-col-e)',
    orbit: 3,
    reach: 1.25,
    weight: 'var(--str-ai-glow-w4, 0)',
  },
];

/**
 * The mass that carries the glow's opacity along its orbit: its orbit, reach and peak alpha. The
 * shader's second, fainter one is left out, as it costs a full layer for little the eye sees.
 */
export const RIDING_BODY = { alpha: 0.6, orbit: 0, reach: 1.15 };

const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
};

/** smoothstep(reach, 0.1, x) over 0..reach as gradient stops, each `paint(weight, offset)`. */
const falloff = (reach: number, paint: (weight: number, offset: string) => string) => {
  const stops: string[] = [];
  for (let k = 0; k <= 10; k++) {
    const x = (reach * k) / 10;
    stops.push(paint(smoothstep(reach, 0.1, x), `${((x / reach) * 100).toFixed(1)}%`));
  }
  return stops.join(', ');
};

/** A mass: its color weighted by the falloff, on its own circle. */
export const massBackground = ({ color, reach, weight = '1' }: Mass) =>
  `radial-gradient(closest-side, ${falloff(
    reach,
    (w, at) =>
      `color-mix(in srgb, ${color} calc(${weight} * ${(w * 100).toFixed(1)}%), transparent) ${at}`,
  )})`;

/** The opacity a mass carries along its orbit: its peak alpha times its falloff. */
export const orbitMask = (orbit: number, reach: number, alpha: number) => {
  const size = `${(reach * R).toFixed(2)}%`;
  const centre = `${(50 + ORBITS[orbit].distance * R).toFixed(2)}% 50%`;
  return `radial-gradient(ellipse ${size} ${size} at ${centre}, ${falloff(
    reach,
    (w, at) => `rgb(0 0 0 / ${(alpha * w).toFixed(3)}) ${at}`,
  )})`;
};

/** How far a mass sits from the centre, as a share of the globe. */
export const orbitDistance = (orbit: number) =>
  `${(ORBITS[orbit].distance * R).toFixed(2)}%`;

type Rgb = [number, number, number];

const rgb = ([r, g, b]: Rgb) =>
  `rgb(${Math.round(r * 255)} ${Math.round(g * 255)} ${Math.round(b * 255)})`;

const scaled = (c: Rgb, k: number): Rgb => [
  clamp(c[0] * k, 0, 1),
  clamp(c[1] * k, 0, 1),
  clamp(c[2] * k, 0, 1),
];

const saturated = (c: Rgb, amount: number): Rgb => {
  const out = [...c];
  saturate(out, amount);
  return out as Rgb;
};

const towardWhite = (c: Rgb, amount: number): Rgb => [
  mix(c[0], 1, amount),
  mix(c[1], 1, amount),
  mix(c[2], 1, amount),
];

/** The field's last steps, saturate3(col, 1.15) and x1.12, folded into each color: both linear. */
const finish = (c: Rgb) => scaled(saturated(c, 1.15), 1.12);

/**
 * The colors the CSS glow mixes, as the shader derives them from the palette: masses saturated
 * x1.7, the first color lightened or darkened where the palette has no color of its own, a
 * near-white tint of it for the base, the halo and a tap's ring. In custom properties for the
 * stylesheet.
 */
export const cssGlowPalette = (palette: Hsv[], dark: number): Record<string, string> => {
  if (!palette.length) return {};
  const colors = palette.map((color) => {
    const out = [0, 0, 0];
    vivid(color, dark, out);
    return out as Rgb;
  });
  const [first] = colors;
  const mass = (c: Rgb) => rgb(finish(saturated(c, 1.7)));
  return {
    '--str-ai-glow-base': rgb(finish(saturated(towardWhite(first, 0.06), 1.3))),
    '--str-ai-glow-col-b': colors[1]
      ? mass(colors[1])
      : rgb(finish(saturated(scaled(first, 1.18), 1.3))),
    '--str-ai-glow-col-c': colors[2]
      ? mass(colors[2])
      : rgb(finish(saturated(scaled(first, 0.85), 1.3))),
    '--str-ai-glow-col-d': mass(colors[3] ?? first),
    '--str-ai-glow-col-e': mass(colors[4] ?? first),
    '--str-ai-glow-halo': rgb(towardWhite(first, dark ? 0.32 : 0.75)),
    '--str-ai-glow-k0': mass(first),
    '--str-ai-glow-ring': rgb(towardWhite(saturated(first, 1.7), 0.4)),
    '--str-ai-glow-w3': colors.length > 3 ? '1' : '0',
    '--str-ai-glow-w4': colors.length > 4 ? '1' : '0',
  };
};

/**
 * Playback rates per state, from the driver's motion: `orbit` how fast the masses turn, `flow`
 * the slow turn of thinking, `tempo` everything else.
 */
export const CSS_GLOW_RATES: Record<
  VoiceAgentState,
  { flow: number; orbit: number; tempo: number }
> = {
  connecting: { flow: 0, orbit: 1, tempo: 0.8 },
  idle: { flow: 0, orbit: 0.405, tempo: 0.32 },
  listening: { flow: 0, orbit: 0.94, tempo: 0.72 },
  speaking: { flow: 0, orbit: 1.375, tempo: 1 },
  thinking: { flow: 1, orbit: 1.875, tempo: 1 },
};

/** Which rate an animation of the stylesheet plays at, or null for one-off animations. */
export const cssGlowRateKind = (animationName: string) => {
  if (animationName.endsWith('-flow') || animationName.endsWith('-unflow')) return 'flow';
  if (animationName.endsWith('-spin') || animationName.endsWith('-unspin'))
    return 'orbit';
  if (animationName.endsWith('-bounce') || animationName.endsWith('-ripple')) return null;
  return 'tempo';
};
