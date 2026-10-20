import type { VoiceVisualizationDriver } from '../driver';

/** The surface a renderer draws on, in device pixels. */
export type VoiceFrame = {
  /** 1 to draw for a dark background, 0 for a light one. */
  dark: number;
  /** Device pixels per CSS pixel. */
  dpr: number;
  driver: VoiceVisualizationDriver;
  height: number;
  width: number;
};

export type VoiceRenderer = {
  draw: (frame: VoiceFrame) => void;
  dispose?: () => void;
};

export const rgba = (c: ArrayLike<number>, alpha: number) =>
  `rgba(${Math.round(c[0] * 255)}, ${Math.round(c[1] * 255)}, ${Math.round(c[2] * 255)}, ${Math.min(Math.max(alpha, 0), 1)})`;
