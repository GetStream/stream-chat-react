import { VoiceVisualizationBounce } from './bounce';
import { MAXIMUM_COLORS } from './palette';
import type { Hsv, VoiceAgentState } from './types';

export type VoiceDriverInput = {
  /** One to five colors. */
  colors: Hsv[];
  /** From 0 to 2. */
  expressivity: number;
  reduceMotion: boolean;
  state: VoiceAgentState;
  /** From 0 to 1, or null when no live audio drives the motion. */
  audioLevel?: number | null;
};

/**
 * How a state moves. `load`, `flow` and `react` each select a motion pattern, one per state, so
 * easing between states crossfades the patterns.
 */
type VoiceMotion = {
  bright: number;
  flow: number;
  load: number;
  react: number;
  sat: number;
  speed: number;
};

const motion = ({
  flow = 0,
  load = 0,
  react = 0,
  speed,
}: Partial<VoiceMotion> & { speed: number }): VoiceMotion => ({
  bright: 1,
  flow,
  load,
  react,
  sat: 1,
  speed,
});

const MOTIONS: Record<VoiceAgentState, VoiceMotion> = {
  connecting: motion({ load: 1, speed: 1 }),
  idle: motion({ react: 0.12, speed: 0.4 }),
  listening: motion({ react: 0.45, speed: 0.9 }),
  speaking: motion({ react: 1, speed: 1.25 }),
  thinking: motion({ flow: 1, speed: 1.25 }),
};

export const NO_TAP = 100;
const MAX_FRAME = 0.05;
const REDUCED = 0.07;
const DRIVERS = 0.08;
const GENTLE = 0.12;
const VOICE = 0.1;
const MIC = 0.35;

/** Expressivity scales amplitude and speed, each with a floor so the motion breathes at 0. */
export const scales = (expressivity: number) => ({
  amplitude: 0.15 + 0.85 * expressivity,
  speed: 0.6 + 0.4 * expressivity,
});

/**
 * The share of the way a value moves in `dt` seconds when it moves `perFrame` of the way each
 * frame at 60 Hz.
 */
export const ease = (perFrame: number, dt: number) => 1 - Math.pow(1 - perFrame, dt * 60);

const rem = (x: number, m: number) => ((x % m) + m) % m;

/** Eases an HSV color, its hue taking the shorter way round the wheel. */
export const easeHsv = (color: Hsv, target: Hsv, fraction: number): Hsv => {
  const hueStep = (rem(target.hue - color.hue + 1.5, 1) - 0.5) * fraction;
  return {
    hue: rem(color.hue + hueStep + 1, 1),
    saturation: color.saturation + (target.saturation - color.saturation) * fraction,
    value: color.value + (target.value - color.value) * fraction,
  };
};

/** The five color slots the renderers read; past the palette they repeat its first color. */
export const slots = (colors: Hsv[]): Hsv[] => {
  const first = colors[0] ?? { hue: 0, saturation: 0, value: 0 };
  return Array.from({ length: MAXIMUM_COLORS }, (_, i) => colors[i] ?? first);
};

/**
 * The motion of a voice visualization: where it is in time, how it moves, and its colors.
 *
 * Each value eases toward the state's motion by a fixed share per frame at 60 Hz, converted to
 * time, so it moves the same at any refresh rate. The shader and the Canvas drawing read the
 * same values, so the renderers move alike.
 */
export class VoiceVisualizationDriver {
  speed: number;
  bright: number;
  sat: number;
  load: number;
  flow: number;
  expressivity: number;
  time = 0;
  flowSpin = 0;
  orbSpin = 0;
  count: number;
  tapX = 0;
  tapY = 0;
  tapAge = NO_TAP;
  hoverX = 0;
  hoverY = 0;
  hoverAmount = 0;
  mic = 0;
  voice = 0;

  private baseReact: number;
  private colors: Hsv[];
  private isHovering = false;
  private bounce = new VoiceVisualizationBounce();
  private currentInput: VoiceDriverInput;

  // Starts settled on the input, so the first frame shows it rather than easing into it.
  constructor(input: VoiceDriverInput) {
    this.currentInput = input;
    const m = MOTIONS[input.state];
    const s = scales(input.expressivity);
    this.speed = m.speed * s.speed;
    this.bright = m.bright;
    this.sat = m.sat;
    this.load = m.load * s.amplitude;
    this.flow = m.flow * s.amplitude;
    this.baseReact = m.react * s.amplitude;
    this.expressivity = input.expressivity;
    this.colors = slots(input.colors);
    this.count = input.colors.length;
  }

  get input() {
    return this.currentInput;
  }

  set input(value: VoiceDriverInput) {
    this.currentInput = value;
    if (value.reduceMotion) this.isHovering = false;
  }

  /** Live audio lifts the motion to its level, whatever the state. */
  get react() {
    return (
      this.baseReact + (Math.max(this.baseReact, this.mic) - this.baseReact) * this.voice
    );
  }

  /** The scale of a tap's bounce. */
  get scale() {
    return this.bounce.scale;
  }

  /** Color slot `index`, 0 to 4; past the palette the slots repeat its first color. */
  color(index: number) {
    return this.colors[index];
  }

  tap(x: number, y: number) {
    if (this.currentInput.reduceMotion) return;
    this.tapX = x;
    this.tapY = y;
    this.tapAge = 0;
    this.bounce.start();
  }

  /** Where a pointer hovers, or null once it has left. */
  hover(x: number | null, y: number | null) {
    if (x === null || y === null || this.currentInput.reduceMotion) {
      this.isHovering = false;
      return;
    }
    this.hoverX = x;
    this.hoverY = y;
    this.isHovering = true;
  }

  advance(seconds: number) {
    // Clamped so a frame after a stall cannot leap the motion.
    const dt = Math.min(Math.max(seconds, 0), MAX_FRAME);
    const input = this.currentInput;
    const m = MOTIONS[input.state];
    const s = scales(input.expressivity);
    const drivers = ease(DRIVERS, dt);
    this.speed += (m.speed * s.speed - this.speed) * drivers;
    this.bright += (m.bright - this.bright) * drivers;
    this.sat += (m.sat - this.sat) * drivers;
    this.load += (m.load * s.amplitude - this.load) * drivers;
    this.flow += (m.flow * s.amplitude - this.flow) * drivers;
    this.baseReact += (m.react * s.amplitude - this.baseReact) * drivers;
    this.expressivity += (input.expressivity - this.expressivity) * drivers;
    // Integrated rather than computed as time times a weight, so a change of state eases the
    // turns instead of jumping their angles.
    const step = dt * (input.reduceMotion ? REDUCED : 1) * this.speed;
    this.time += step;
    this.flowSpin += step * this.flow;
    this.orbSpin += step * (1 + 0.5 * this.flow + 0.1 * this.baseReact);
    this.tapAge += dt;
    this.bounce.advance(dt);
    const gentle = ease(GENTLE, dt);
    this.hoverAmount += ((this.isHovering ? 1 : 0) - this.hoverAmount) * gentle;
    const level = input.audioLevel ?? null;
    this.voice += ((level === null ? 0 : 1) - this.voice) * ease(VOICE, dt);
    this.mic += ((level ?? 0) - this.mic) * ease(MIC, dt);
    const targets = slots(input.colors);
    for (let i = 0; i < this.colors.length; i++) {
      this.colors[i] = easeHsv(this.colors[i], targets[i], gentle);
    }
    this.count += (input.colors.length - this.count) * gentle;
  }
}
