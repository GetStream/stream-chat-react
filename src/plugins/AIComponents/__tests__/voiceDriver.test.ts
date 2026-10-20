import { easeOut, scaleAt, VoiceVisualizationBounce } from '../VoiceVisualization/bounce';
import {
  ease,
  NO_TAP,
  type VoiceDriverInput,
  VoiceVisualizationDriver,
} from '../VoiceVisualization/driver';
import type { Hsv, VoiceAgentState } from '../VoiceVisualization/types';

// Ported from stream-chat-android's VoiceVisualizationDriverTest and VoiceVisualizationBounceTest,
// so both SDKs move alike.

const blue: Hsv = { hue: 218 / 360, saturation: 1, value: 1 };
const red: Hsv = { hue: 0, saturation: 1, value: 1 };
const frame = 1 / 60;

const input = (
  state: VoiceAgentState,
  overrides: Partial<Omit<VoiceDriverInput, 'state'>> = {},
): VoiceDriverInput => ({
  audioLevel: null,
  colors: [blue],
  expressivity: 1,
  reduceMotion: false,
  state,
  ...overrides,
});

const run = (driver: VoiceVisualizationDriver, seconds: number) => {
  for (let i = 0; i < Math.floor(seconds / frame); i++) driver.advance(frame);
};

describe('VoiceVisualizationDriver', () => {
  it('starts settled on the state', () => {
    const driver = new VoiceVisualizationDriver(input('speaking'));

    expect(driver.react).toBe(1);
    expect(driver.load).toBe(0);
    expect(driver.flow).toBe(0);
    expect(driver.bright).toBe(1);
    expect(driver.time).toBe(0);
    expect(driver.count).toBe(1);
    expect(driver.scale).toBe(1);
    expect(driver.tapAge).toBe(NO_TAP);
    expect(driver.color(0)).toEqual(blue);
    expect(driver.color(4)).toEqual(blue);
  });

  it('eases toward the motion of a new state', () => {
    const driver = new VoiceVisualizationDriver(input('idle'));
    driver.input = input('connecting');

    driver.advance(frame);
    expect(driver.load).toBeCloseTo(0.08, 4);
    run(driver, 2);
    expect(driver.load).toBeCloseTo(1, 3);
    expect(driver.react).toBeCloseTo(0, 3);
  });

  it('eases the same at any frame rate', () => {
    const at60 = new VoiceVisualizationDriver(input('idle'));
    const at120 = new VoiceVisualizationDriver(input('idle'));
    at60.input = input('speaking');
    at120.input = input('speaking');

    for (let i = 0; i < 30; i++) at60.advance(1 / 60);
    for (let i = 0; i < 60; i++) at120.advance(1 / 120);

    expect(at60.react).toBeCloseTo(at120.react, 4);
    expect(Math.abs(at60.time - at120.time)).toBeLessThan(1e-2);
  });

  it('clamps a long frame', () => {
    const driver = new VoiceVisualizationDriver(input('idle'));

    driver.advance(5);

    expect(driver.time).toBeCloseTo(0.05 * 0.4, 6);
  });

  it('turns the flow only while thinking', () => {
    const driver = new VoiceVisualizationDriver(input('speaking'));
    run(driver, 1);
    expect(driver.flowSpin).toBe(0);

    driver.input = input('thinking');
    run(driver, 1);
    expect(driver.flowSpin).toBeGreaterThan(0);
  });

  it('keeps the colors turning in every state', () => {
    const driver = new VoiceVisualizationDriver(input('idle'));

    run(driver, 1);

    expect(driver.orbSpin).toBeGreaterThan(0);
  });

  it('scales amplitude and speed with expressivity', () => {
    const lively = new VoiceVisualizationDriver(input('speaking', { expressivity: 2 }));
    const still = new VoiceVisualizationDriver(input('speaking', { expressivity: 0 }));

    expect(lively.react).toBeCloseTo(1.85, 5);
    expect(still.react).toBeCloseTo(0.15, 5);
    lively.advance(0.05);
    expect(lively.time).toBeCloseTo(0.05 * 1.25 * 1.4, 5);
  });

  it('slows time and ignores the pointer under reduced motion', () => {
    const driver = new VoiceVisualizationDriver(input('idle', { reduceMotion: true }));

    driver.tap(0.1, 0.1);
    driver.hover(0.1, 0.1);
    driver.advance(0.05);

    expect(driver.time).toBeCloseTo(0.05 * 0.07 * 0.4, 7);
    expect(driver.tapAge).toBeGreaterThan(NO_TAP);
    expect(driver.scale).toBe(1);
    expect(driver.hoverAmount).toBe(0);
  });

  it('stops hovering when reduced motion turns on', () => {
    const driver = new VoiceVisualizationDriver(input('idle'));
    driver.hover(0.1, 0.1);
    run(driver, 1);
    expect(driver.hoverAmount).toBeGreaterThan(0.9);

    driver.input = input('idle', { reduceMotion: true });
    run(driver, 1);
    expect(driver.hoverAmount).toBeCloseTo(0, 3);
  });

  it('ripples from a tap and bounces', () => {
    const driver = new VoiceVisualizationDriver(input('idle'));

    driver.tap(0.1, -0.2);
    expect(driver.tapX).toBe(0.1);
    expect(driver.tapY).toBe(-0.2);
    expect(driver.tapAge).toBe(0);

    driver.advance(0.05);
    expect(driver.tapAge).toBeCloseTo(0.05, 6);
    expect(driver.scale).toBeLessThan(1);
    run(driver, 0.5);
    expect(driver.scale).toBe(1);
  });

  it('eases hovering in and out', () => {
    const driver = new VoiceVisualizationDriver(input('idle'));

    driver.hover(0.2, 0.1);
    run(driver, 1);
    expect(driver.hoverAmount).toBeCloseTo(1, 3);
    expect(driver.hoverX).toBe(0.2);

    driver.hover(null, null);
    run(driver, 1);
    expect(driver.hoverAmount).toBeCloseTo(0, 3);
    expect(driver.hoverX).toBe(0.2);
  });

  it('lifts the motion to a live audio level', () => {
    const driver = new VoiceVisualizationDriver(input('idle', { audioLevel: 0.8 }));

    run(driver, 2);
    expect(driver.mic).toBeCloseTo(0.8, 3);
    expect(driver.voice).toBeCloseTo(1, 3);
    expect(driver.react).toBeCloseTo(0.8, 3);

    driver.input = input('idle');
    run(driver, 2);
    expect(driver.voice).toBeCloseTo(0, 3);
    expect(driver.react).toBeCloseTo(0.12, 3);
  });

  it('eases a hue the short way round', () => {
    const driver = new VoiceVisualizationDriver(
      input('idle', { colors: [{ hue: 0.95, saturation: 1, value: 1 }] }),
    );
    driver.input = input('idle', { colors: [{ hue: 0.05, saturation: 1, value: 1 }] });

    driver.advance(frame);
    expect(driver.color(0).hue).toBeCloseTo(0.962, 4);
    run(driver, 2);
    expect(driver.color(0).hue).toBeCloseTo(0.05, 3);
  });

  it('repeats the first color in empty slots and crossfades the count', () => {
    const driver = new VoiceVisualizationDriver(input('idle', { colors: [blue, red] }));
    expect(driver.color(1)).toEqual(red);
    expect(driver.color(2)).toEqual(blue);

    driver.input = input('idle', { colors: [blue, red, red] });
    driver.advance(frame);
    expect(driver.count).toBeCloseTo(2.12, 4);
  });

  it('moves the per-frame share at 60 Hz', () => {
    expect(ease(0.08, 1 / 60)).toBeCloseTo(0.08, 5);
    expect(ease(0.08, 0)).toBe(0);
  });
});

describe('VoiceVisualizationBounce', () => {
  it('follows the keyframes', () => {
    expect(scaleAt(0)).toBe(1);
    expect(scaleAt(0.15)).toBeCloseTo(0.965, 5);
    expect(scaleAt(0.3)).toBeCloseTo(0.93, 5);
    expect(scaleAt(0.62)).toBeCloseTo(1.03, 5);
    expect(scaleAt(1)).toBeCloseTo(1, 5);
  });

  it('times the run on the CSS ease-out', () => {
    expect(easeOut(0)).toBeCloseTo(0, 4);
    expect(Math.abs(easeOut(0.5) - 0.684)).toBeLessThan(2e-3);
    expect(easeOut(1)).toBeCloseTo(1, 4);
  });

  it('dips, overshoots and settles', () => {
    const bounce = new VoiceVisualizationBounce();
    expect(bounce.scale).toBe(1);

    bounce.start();
    const scales = Array.from({ length: 21 }, () => {
      const scale = bounce.scale;
      bounce.advance(1 / 60);
      return scale;
    });
    const min = Math.min(...scales);
    const max = Math.max(...scales);

    expect(scales[0]).toBeCloseTo(1, 5);
    expect(Math.abs(min - 0.93)).toBeLessThan(0.01);
    expect(Math.abs(max - 1.03)).toBeLessThan(0.01);
    expect(scales.indexOf(min)).toBeLessThan(scales.indexOf(max));
    expect(bounce.scale).toBe(1);
  });
});
