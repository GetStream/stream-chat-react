import {
  type VoiceDriverInput,
  VoiceVisualizationDriver,
} from '../VoiceVisualization/driver';
import { smoothstep, speechEnv } from '../VoiceVisualization/math';
import { createWaveRenderer } from '../VoiceVisualization/renderers/waveRenderer';
import type { VoiceAgentState } from '../VoiceVisualization/types';

const SIZE = 200;
const FRAME = 1 / 60;

/** A 2D context that keeps the points of the last path drawn, centred and in the shorter side. */
const createPathContext = () => {
  let points: Array<[number, number]> = [];
  const add = (x: number, y: number) =>
    points.push([(x - SIZE / 2) / SIZE, (SIZE / 2 - y) / SIZE]);
  const ctx = {
    beginPath: () => {
      points = [];
    },
    clearRect: () => undefined,
    createLinearGradient: () => ({ addColorStop: () => undefined }),
    lineTo: add,
    moveTo: add,
    stroke: () => undefined,
  };
  return { ctx: ctx as unknown as CanvasRenderingContext2D, points: () => points };
};

const input = (
  state: VoiceAgentState,
  overrides: Partial<Omit<VoiceDriverInput, 'state'>> = {},
): VoiceDriverInput => ({
  audioLevel: null,
  colors: [{ hue: 0.6, saturation: 1, value: 1 }],
  expressivity: 1,
  reduceMotion: false,
  state,
  ...overrides,
});

const setUp = (state: VoiceAgentState, overrides?: Partial<VoiceDriverInput>) => {
  const driver = new VoiceVisualizationDriver(input(state, overrides));
  const { ctx, points } = createPathContext();
  const renderer = createWaveRenderer(ctx);
  let first = true;
  /** Advances and draws `frames` frames, then returns the last one's points. */
  const run = (frames = 1) => {
    for (let i = 0; i < frames; i++) {
      if (!first) driver.advance(FRAME);
      renderer.draw({
        dark: 0,
        driver,
        height: SIZE,
        seconds: first ? 0 : FRAME,
        width: SIZE,
      });
      first = false;
    }
    return points();
  };
  return { driver, run };
};

const steepest = (points: Array<[number, number]>) => {
  let slope = 0;
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    slope = Math.max(slope, Math.abs((y1 - y0) / (x1 - x0)));
  }
  return slope;
};

const height = (points: Array<[number, number]>) =>
  Math.max(...points.map(([, y]) => Math.abs(y)));

describe('the wave renderer', () => {
  it('draws the native wave while the wave is calm', () => {
    for (const state of ['idle', 'connecting', 'thinking'] as const) {
      const { driver, run } = setUp(state);
      const points = run(30);

      // The wave as Android and iOS draw it, unsmoothed.
      const t = driver.time;
      const react = driver.react;
      const center = driver.load * 0.3 * Math.sin(t * 1.3);
      const freq = 24 + 26 * react + 10 * driver.flow;
      const speech = smoothstep(0.6, 1, react) * 0.26 * speechEnv(t);
      const reach =
        0.018 + 0.022 * react + speech + 0.14 * driver.flow + 0.1 * driver.load;
      points.forEach(([x, y]) => {
        const native =
          Math.exp(-(((x - center) / 0.18) ** 2)) * reach * Math.sin(x * freq - t * 5);
        expect(y).toBeCloseTo(native, 6);
      });
    }
  });

  it('spreads its crests out instead of spiking, however loud the speech', () => {
    // A loud voice, and the agent's own speech with its quick syllables.
    const loud = setUp('speaking', { audioLevel: 1, expressivity: 2 });
    const own = setUp('speaking', { expressivity: 2 });

    let slope = 0;
    for (let i = 0; i < 600; i++) {
      slope = Math.max(slope, steepest(loud.run()), steepest(own.run()));
    }

    // Capped at 6, with 10% headroom while the spacing catches up with a quick syllable.
    expect(slope).toBeLessThan(6.6);
    expect(slope).toBeGreaterThan(4);
  });

  it('rises quickly with the voice and settles slowly after it', () => {
    const { driver, run } = setUp('listening', { audioLevel: 0 });
    const quiet = height(run(60));

    driver.input = input('listening', { audioLevel: 1 });
    const rising = height(run(6));
    const loud = height(run(60));

    driver.input = input('listening', { audioLevel: 0 });
    const settling = height(run(6));
    const settled = height(run(180));

    expect(rising - quiet).toBeGreaterThan(0.6 * (loud - quiet));
    expect(settling - quiet).toBeGreaterThan(0.5 * (loud - quiet));
    expect(settled - quiet).toBeLessThan(0.05 * (loud - quiet));
  });
});
