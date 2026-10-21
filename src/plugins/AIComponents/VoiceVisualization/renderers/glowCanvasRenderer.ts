import type { VoiceVisualizationDriver } from '../driver';
import { clamp, mix, noise, saturate, smoothstep, speechEnv, vivid } from '../math';
import { rgba, type VoiceFrame, type VoiceRenderer } from './types';

const REACH = [1.15, 1.3, 1.2, 1.25];

/** How far from the centre a tap still lands on the globe, as a share of the shorter side. */
const GLOBE_REACH = 0.32;

/** Whether a point, centred and normalized to the shorter side with y up, lands on the globe. */
export const glowContains = (x: number, y: number) => Math.hypot(x, y) < GLOBE_REACH;

/**
 * The glow drawn with a handful of gradients: color masses orbiting inside a soft globe, a
 * highlight, a rim and a halo. Cheaper than the shader and drawn wherever a 2D canvas is; it
 * moves the same but has none of the shader's noise-warped marbling or ripples.
 */
export const createGlowCanvasRenderer = (
  ctx: CanvasRenderingContext2D,
): VoiceRenderer => {
  const base = [0, 0, 0];
  const k0 = [0, 0, 0];
  const colB = [0, 0, 0];
  const colC = [0, 0, 0];
  const colD = [0, 0, 0];
  const colE = [0, 0, 0];
  const halo = [0, 0, 0];
  const rim = [0, 0, 0];
  const tmp = [0, 0, 0];
  const tmp2 = [0, 0, 0];
  const angles = [0, 0, 0, 0];

  /** Slot `index` fading in over a lighter or darker first color as the palette grows. */
  const mixSlot = (
    d: VoiceVisualizationDriver,
    index: number,
    dark: number,
    lighter: boolean,
    into: number[],
  ) => {
    for (let i = 0; i < 3; i++) tmp2[i] = clamp(tmp[i] * (lighter ? 1.18 : 0.85), 0, 1);
    saturate(tmp2, 1.3);
    vivid(d.color(index), dark, into);
    saturate(into, 1.7);
    const present = clamp(d.count - index, 0, 1);
    for (let i = 0; i < 3; i++) into[i] = mix(tmp2[i], into[i], present);
  };

  const colors = (d: VoiceVisualizationDriver, dark: number) => {
    vivid(d.color(0), dark, tmp);
    for (let i = 0; i < 3; i++) k0[i] = tmp[i];
    saturate(k0, 1.7);
    for (let i = 0; i < 3; i++) base[i] = mix(tmp[i], 1, 0.06);
    saturate(base, 1.3);
    for (let i = 0; i < 3; i++)
      halo[i] = mix(mix(tmp[i], 1, 0.75), mix(tmp[i], 1, 0.32), dark);
    for (let i = 0; i < 3; i++) rim[i] = mix(1, k0[i], 0.6);
    mixSlot(d, 1, dark, true, colB);
    mixSlot(d, 2, dark, false, colC);
    vivid(d.color(3), dark, colD);
    saturate(colD, 1.7);
    vivid(d.color(4), dark, colE);
    saturate(colE, 1.7);
  };

  const circle = (
    x: number,
    y: number,
    radius: number,
    fill: CanvasGradient | string,
  ) => {
    ctx.beginPath();
    ctx.arc(x, y, Math.max(radius, 0), 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
  };

  const radial = (
    x: number,
    y: number,
    radius: number,
    stops: Array<[number, string]>,
  ) => {
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, Math.max(radius, 1e-3));
    for (const [offset, color] of stops)
      gradient.addColorStop(clamp(offset, 0, 1), color);
    return gradient;
  };

  const withScale = (scale: number, cx: number, cy: number, draw: () => void) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.translate(-cx, -cy);
    draw();
    ctx.restore();
  };

  const draw = ({ dark, driver: d, height, width }: VoiceFrame) => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, width, height);
    const side = Math.min(width, height);
    if (side <= 0) return;
    const cx = width / 2;
    const cy = height / 2;
    const t = d.time;
    const react = d.react;
    const speak = smoothstep(0.6, 1, react);
    const wobble = 0.55 + 0.25 * Math.sin(t * 1.6);
    const speech = mix(react * mix(wobble, speechEnv(t), speak), d.mic, d.voice);
    const speechSmooth = mix(speech, react * wobble, 0.5 * speak);
    const energy =
      0.12 + 0.3 * react + 0.18 * d.flow + 0.28 * d.load + 0.06 * speechSmooth;
    const r =
      0.24 *
      side *
      (1 +
        speechSmooth * 0.2 +
        d.load * 0.05 * Math.sin(t * 2) +
        react * 0.04 * Math.sin(t * 1.6));
    const gain = d.bright * mix(1, 0.45 + 0.35 * Math.sin(t * 2), d.load);
    colors(d, dark);

    // Each orbit's angle, once a frame rather than once a blob.
    const flowTurn = d.flowSpin * 0.3;
    angles[0] = d.orbSpin * 0.42 + 2 * noise(t * 0.12, 0) + flowTurn;
    angles[1] = -d.orbSpin * 0.34 + 2 * noise(t * 0.1, 5) + 2 + flowTurn;
    angles[2] = d.orbSpin * 0.3 + 2 * noise(t * 0.11, 9) + 1 + flowTurn;
    angles[3] = -d.orbSpin * 0.26 + 2 * noise(t * 0.09, 14) + 3.5 + flowTurn;

    const blob = (i: number, color: number[], alpha: number) => {
      if (alpha <= 0.002) return;
      const angle = angles[i];
      const distance = 0.4 - 0.02 * i;
      // A slow breath stands in for the shader's per-pixel warp.
      const blobRadius = REACH[i] * r * (1 + 0.12 * energy * noise(t * 0.5 + i, 33));
      const x = cx + distance * r * Math.cos(angle);
      const y = cy - distance * r * Math.sin(angle);
      circle(
        x,
        y,
        blobRadius,
        radial(x, y, blobRadius, [
          [0, rgba(color, alpha)],
          [0.09, rgba(color, alpha)],
          [0.55, rgba(color, alpha * 0.5)],
          [1, rgba(color, 0)],
        ]),
      );
    };

    const edge = r * 1.06;
    withScale(d.scale, cx, cy, () => {
      // Nothing past the soft edge survives its mask, so the blobs are not painted there at all:
      // they reach well beyond the globe, and painting less is most of the cost.
      ctx.beginPath();
      ctx.arc(cx, cy, edge, 0, Math.PI * 2);
      ctx.clip();
      circle(cx, cy, edge, rgba(base, 0.15 * gain));
      const blobAlpha = 0.6 * (0.75 + 0.25 * energy) * gain;
      blob(1, colB, blobAlpha * 0.8);
      blob(0, k0, blobAlpha);
      blob(0, colC, blobAlpha * 0.5);
      blob(2, colD, blobAlpha * clamp(d.count - 3, 0, 1));
      blob(3, colE, blobAlpha * clamp(d.count - 4, 0, 1));
      // The highlight and the rim.
      circle(
        cx,
        cy,
        r * 1.06,
        radial(cx - 0.35 * r, cy - 0.45 * r, r, [
          [0, `rgba(255, 255, 255, ${clamp(0.16 * gain, 0, 1)})`],
          [1, 'rgba(255, 255, 255, 0)'],
        ]),
      );
      circle(
        cx,
        cy,
        r * 1.06,
        radial(cx, cy, r * 1.06, [
          [0.7, rgba(rim, 0)],
          [0.95, rgba(rim, 0.1 * gain)],
          [1, rgba(rim, 0)],
        ]),
      );
    });

    // The soft edge, outside the bounce's scale so it follows the globe at any scale. The canvas
    // is the glow's own layer, so this masks only the glow, never what is behind it. The clip
    // above left nothing outside the globe, so only its square needs masking.
    const masked = edge * d.scale;
    ctx.globalCompositeOperation = 'destination-in';
    ctx.fillStyle = radial(cx, cy, masked, [
      [0, 'rgba(0, 0, 0, 1)'],
      [0.62 / 1.06, 'rgba(0, 0, 0, 1)'],
      [1, 'rgba(0, 0, 0, 0)'],
    ]);
    ctx.fillRect(cx - masked, cy - masked, masked * 2, masked * 2);

    // The halo, behind the globe.
    ctx.globalCompositeOperation = 'destination-over';
    withScale(d.scale, cx, cy, () => {
      const alpha = (mix(0.05, 0.1, dark) + 0.05 * react) * gain;
      const outer = r * 0.8 + 0.25 * side;
      const inner = (r * 0.8) / outer;
      circle(
        cx,
        cy,
        outer,
        radial(cx, cy, outer, [
          [0, rgba(halo, alpha)],
          [inner, rgba(halo, alpha)],
          [inner + (0.09 * side) / outer, rgba(halo, alpha * Math.exp(-1))],
          [1, rgba(halo, 0)],
        ]),
      );
    });
    ctx.globalCompositeOperation = 'source-over';
  };

  return { draw };
};
