import type { ComponentPropsWithoutRef } from 'react';

/**
 * What a voice agent is doing, which a voice visualization shows as motion.
 *
 * The states differ only in how a visualization moves, never in its colors, and changing the
 * state eases from one motion into the next.
 *
 * - `idle`: waiting to be spoken to, a calm, barely-there shimmer.
 * - `connecting`: not ready yet, a loader sweep with a pulsing breath.
 * - `listening`: hearing somebody, a gentle expand and contract.
 * - `thinking`: working on an answer, a slow turn or a travelling wave.
 * - `speaking`: talking, strong motion that ebbs and pauses like speech.
 */
export type VoiceAgentState =
  | 'idle'
  | 'connecting'
  | 'listening'
  | 'thinking'
  | 'speaking';

/**
 * How `VoiceGlow` is drawn. Either way it moves the same; only the look and the cost differ.
 *
 * - `auto`: WebGL where the browser can create a context, otherwise Canvas.
 * - `webgl`: a shader computing every pixel, the richest look and the most GPU. Canvas when
 *   WebGL is unavailable or its context is lost.
 * - `canvas`: a handful of 2D gradients, cheaper, without the shader's marbling or its ripples
 *   from a tap or a hovering pointer.
 * - `css`: the shader's composition in CSS, animated by the browser's compositor. It keeps
 *   moving while the page is busy and needs no canvas, at the cost of the shader's fine
 *   marbling; a tap sends out a ring instead of a ripple, and a hovering pointer does nothing.
 */
export type VoiceGlowRendering = 'auto' | 'webgl' | 'canvas' | 'css';

export type VoiceVisualizationProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  'children'
> & {
  /** What the agent is doing, which sets how the visualization moves. */
  state: VoiceAgentState;
  /**
   * The level of whoever is talking, from 0 to 1, read once a frame. Feed it at 15 Hz or more
   * for the visualization to move with the words; returning `null` animates speech on its own.
   * See `useAudioLevel` to read it from a `MediaStream`.
   */
  audioLevel?: () => number | null | undefined;
  /**
   * One to five CSS colors. Past five are ignored. When omitted or empty, the theme's accent
   * color (`--str-chat__ai-voice-color`) is used.
   */
  colors?: string[];
  /** From 0 to 2: how far and how fast it moves. Colors never change with it. Defaults to 1. */
  expressivity?: number;
};

/** A color as hue (a fraction of a turn), saturation and value, each from 0 to 1. */
export type Hsv = { hue: number; saturation: number; value: number };
