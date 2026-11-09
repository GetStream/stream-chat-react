import { renderHook } from '@testing-library/react';

import { useAudioLevel } from '..';
import { levelFromRms, rootMeanSquare } from '../VoiceVisualization/useAudioLevel';
import { AudioContextMock } from '../../../mock-builders/browser/AudioContext';

let samples = new Uint8Array(0);

class AnalyserFake {
  fftSize = 2048;
  connect = vi.fn();
  disconnect = vi.fn();
  getByteTimeDomainData = vi.fn((out: Uint8Array) =>
    out.set(samples.subarray(0, out.length)),
  );
}

class AudioContextFake extends AudioContextMock {
  static instances: AudioContextFake[] = [];
  state = 'running';
  analyser = new AnalyserFake();
  source = { connect: vi.fn(), disconnect: vi.fn() };
  createAnalyser = vi.fn(() => this.analyser) as never;
  createMediaStreamSource = vi.fn(() => this.source) as never;
  close = vi.fn(() => {
    this.state = 'closed';
    return Promise.resolve();
  }) as never;
  constructor() {
    super();
    AudioContextFake.instances.push(this);
  }
}

const stream = (audioTracks = 1) =>
  ({ getAudioTracks: () => Array.from({ length: audioTracks }, () => ({})) }) as never;

describe('useAudioLevel', () => {
  beforeEach(() => {
    AudioContextFake.instances = [];
    samples = new Uint8Array(2048).fill(128);
    vi.stubGlobal('AudioContext', AudioContextFake);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('measures the RMS of time-domain samples', () => {
    expect(rootMeanSquare(new Uint8Array([128, 128]))).toBe(0);
    expect(rootMeanSquare(new Uint8Array([0, 0]))).toBe(1);
    expect(rootMeanSquare(new Uint8Array([192, 64]))).toBeCloseTo(0.5, 5);
    expect(rootMeanSquare(new Uint8Array(0))).toBe(0);
  });

  it('cuts room noise and spreads speech across 0 to 1', () => {
    expect(levelFromRms(0.005)).toBe(0);
    expect(levelFromRms(0.11)).toBeCloseTo(0.5, 5);
    expect(levelFromRms(1)).toBe(1);
  });

  it('returns null without a stream', () => {
    const { result } = renderHook(() => useAudioLevel(null));

    expect(result.current()).toBeNull();
    expect(AudioContextFake.instances).toHaveLength(0);
  });

  it('returns null for a stream with no audio', () => {
    const { result } = renderHook(() => useAudioLevel(stream(0)));

    expect(result.current()).toBeNull();
  });

  it('reads the level of a stream when asked', () => {
    const { result } = renderHook(() => useAudioLevel(stream()));
    const [context] = AudioContextFake.instances;
    expect(context.source.connect).toHaveBeenCalledWith(context.analyser);
    expect(result.current()).toBe(0);

    samples = new Uint8Array(2048).map((_, i) => (i % 2 ? 192 : 64));

    expect(result.current()).toBe(1);
    expect(context.analyser.getByteTimeDomainData).toHaveBeenCalledTimes(2);
  });

  it('measures over about 43 ms, a few pitch periods of a voice', () => {
    renderHook(() => useAudioLevel(stream()));

    expect(AudioContextFake.instances[0].analyser.fftSize).toBe(2048);
  });

  it('keeps the same getter across renders', () => {
    const { rerender, result } = renderHook(() => useAudioLevel(stream()));
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
  });

  it('closes the audio graph when the stream changes and on unmount', () => {
    const { rerender, unmount } = renderHook(({ s }) => useAudioLevel(s), {
      initialProps: { s: stream() },
    });
    const [first] = AudioContextFake.instances;

    rerender({ s: stream() });
    expect(first.close).toHaveBeenCalled();
    expect(first.source.disconnect).toHaveBeenCalled();

    const second = AudioContextFake.instances[1];
    unmount();
    expect(second.close).toHaveBeenCalled();
  });
});
