import type { VoiceVisualizationDriver } from '../driver';
import { clamp, mix, saturate, smoothstep, speechEnv, vivid } from '../math';
import { rgba, type VoiceFrame, type VoiceRenderer } from './types';

const POINTS = 160;
const STOPS = 13;
const START = -0.42;
const END = 0.42;

const sq = (x: number) => x * x;

const bandCenter = (i: number, seg: number, t: number) => {
  switch (i) {
    case 0:
      return 0.5 * seg + 0.12 * Math.sin(t * 0.13);
    case 1:
      return 1.5 * seg + 0.13 * Math.sin(t * 0.11 + 2.1);
    case 2:
      return 2.5 * seg + 0.12 * Math.sin(t * 0.17 + 4.2);
    case 3:
      return 3.5 * seg + 0.12 * Math.sin(t * 0.15 + 1);
    default:
      return 4.5 * seg + 0.12 * Math.sin(t * 0.1 + 3.3);
  }
};

/** Whether a point, centred and normalized to the shorter side with y up, lands on the string. */
export const waveContains = (x: number, y: number) =>
  Math.abs(x) < 0.5 && Math.abs(y) < 0.14;

/**
 * The wave: a string, flat at its ends, carrying a wave packet that erupts with speech, with up
 * to five colors flowing along it in bands. Its buffers are reused from one frame to the next.
 */
export const createWaveRenderer = (ctx: CanvasRenderingContext2D): VoiceRenderer => {
  const xs = new Float32Array(POINTS + 1);
  const ys = new Float32Array(POINTS + 1);
  const band = Array.from({ length: 5 }, () => [0, 0, 0]);
  const color = [0, 0, 0];

  /** The string's color at `x`: the bands weighed by how near their centres are, faded at the ends. */
  const stopColor = (d: VoiceVisualizationDriver, x: number) => {
    const seg = 1 / Math.max(d.count, 1);
    const bandWidth = seg * 0.7;
    const gx = clamp(x + 0.5, 0, 1);
    let total = 1e-4;
    color.fill(0);
    for (let i = 0; i < 5; i++) {
      const present = i === 0 ? 1 : clamp(d.count - i, 0, 1);
      const weight =
        Math.exp(-sq((gx - bandCenter(i, seg, d.time)) / bandWidth)) * present;
      for (let j = 0; j < 3; j++) color[j] += band[i][j] * weight;
      total += weight;
    }
    for (let j = 0; j < 3; j++) color[j] /= total;
    saturate(color, 1.2);
    saturate(color, d.sat);
    const alpha = smoothstep(0.4, 0.24, Math.abs(x)) * d.bright;
    return rgba(color, alpha);
  };

  const draw = ({ dark, dpr, driver: d, height, width }: VoiceFrame) => {
    ctx.clearRect(0, 0, width, height);
    const m = Math.min(width, height);
    if (m <= 0) return;
    const t = d.time;
    const react = d.react;
    const center = d.load * 0.3 * Math.sin(t * 1.3);
    const freq = 24 + 26 * react + 10 * d.flow;
    const speak = smoothstep(0.6, 1, react);
    const drive = mix(speak * 0.26 * speechEnv(t), 0.3 * d.mic, d.voice);
    const reach = 0.018 + 0.022 * react + drive + 0.14 * d.flow + 0.1 * d.load;
    const tapAlive = d.tapAge < 1.5;
    const hovered = d.hoverAmount > 0.001;

    for (let i = 0; i <= POINTS; i++) {
      const x = START + ((END - START) * i) / POINTS;
      let y = Math.exp(-sq((x - center) / 0.18)) * reach * Math.sin(x * freq - t * 5);
      if (tapAlive) {
        y +=
          Math.exp(-sq((x - d.tapX) / 0.12)) *
          Math.sin((x - d.tapX) * 40 - d.tapAge * 24) *
          Math.exp(-d.tapAge * 2.6) *
          0.05;
      }
      if (hovered) {
        y +=
          Math.exp(-sq((x - d.hoverX) / 0.12)) *
          Math.sin((x - d.hoverX) * 40 - t * 7) *
          d.hoverAmount *
          0.04;
      }
      xs[i] = width / 2 + x * m * d.scale;
      ys[i] = height / 2 - y * m * d.scale;
    }

    // Broad color bands drifting along the string, its ends fading out.
    for (let i = 0; i < 5; i++) vivid(d.color(i), dark, band[i]);
    const gradient = ctx.createLinearGradient(
      width / 2 + START * m,
      0,
      width / 2 + END * m,
      0,
    );
    for (let s = 0; s < STOPS; s++) {
      gradient.addColorStop(
        s / (STOPS - 1),
        stopColor(d, START + ((END - START) * s) / (STOPS - 1)),
      );
    }

    ctx.beginPath();
    ctx.moveTo(xs[0], ys[0]);
    for (let i = 1; i <= POINTS; i++) ctx.lineTo(xs[i], ys[i]);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = Math.max(0.006 * m, 1.5 * dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  return { draw };
};
