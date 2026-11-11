const DURATION = 0.34;
const OFFSETS = [0, 0.3, 0.62, 1];
const SCALES = [1, 0.93, 1.03, 1];

/**
 * The bounce of a tap: a dip to 93% and an overshoot to 103% before settling, over 340 ms.
 *
 * These are authored keyframes rather than a spring: the ease-out curve times the whole run and
 * the keyframes are linear between their stops.
 */
export class VoiceVisualizationBounce {
  static readonly DURATION = DURATION;

  private age = Number.POSITIVE_INFINITY;

  start() {
    this.age = 0;
  }

  advance(seconds: number) {
    this.age += seconds;
  }

  get scale() {
    if (this.age >= DURATION) return 1;
    return scaleAt(easeOut(Math.max(this.age, 0) / DURATION));
  }
}

export const scaleAt = (progress: number) => {
  for (let i = 1; i < OFFSETS.length; i++) {
    if (progress <= OFFSETS[i]) {
      const fraction = (progress - OFFSETS[i - 1]) / (OFFSETS[i] - OFFSETS[i - 1]);
      return SCALES[i - 1] + (SCALES[i] - SCALES[i - 1]) * fraction;
    }
  }
  return 1;
};

/** CSS `ease-out`, `cubic-bezier(0, 0, 0.58, 1)`. */
export const easeOut = (x: number) => {
  const bx = 3 * 0.58;
  const ax = 1 - bx;
  const by = 3;
  const ay = 1 - by;
  const sampleX = (t: number) => (ax * t + bx) * t * t;
  const sampleY = (t: number) => (ay * t + by) * t * t;
  let low = 0;
  let high = 1;
  for (let i = 0; i < 24; i++) {
    const middle = (low + high) / 2;
    if (sampleX(middle) < x) low = middle;
    else high = middle;
  }
  return sampleY((low + high) / 2);
};
