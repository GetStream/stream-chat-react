import { fromPartial } from '@total-typescript/shoehorn';
import { AudioPlayer, type AudioPlayerOptions, elementIsPlaying } from '../AudioPlayer';
import type { AudioPlayerPool } from '../AudioPlayerPool';

// ---- Keep throttle synchronous so seek assertions are deterministic ----
vi.mock('lodash.throttle', () => ({
  default: (fn: (...args: unknown[]) => unknown) => fn,
}));

// ---- Stable console noise filter (optional) ----
const originalConsoleError = console.error;
beforeAll(() => {
  vi.spyOn(console, 'error').mockImplementation((...args) => {
    const msg = String(args[0]?.message ?? args[0] ?? '');
    if (/Not implemented/i.test(msg)) return;
    originalConsoleError(...args);
  });
});

// ---- Helpers ----
const SRC = 'https://example.com/a.mp3';
const MIME = 'audio/mpeg';

const createdAudios: HTMLAudioElement[] = [];
const makeErrorPlugin = () => {
  const onError = vi.fn();
  return {
    onError,
    plugin: { id: 'TestErrorPlugin', onError },
  };
};

const makePlayer = (overrides: Partial<AudioPlayerOptions> = {}) => {
  const pool = fromPartial<AudioPlayerPool>({
    acquireElement: ({ src }: { ownerId: string; src: string }) => new Audio(src),
    deregister: () => {},
    releaseElement: () => {},
    setActiveAudioPlayer: vi.fn(),
  });
  return new AudioPlayer({
    durationSeconds: 100,
    id: 'id-1',
    mimeType: MIME,
    pool,
    src: SRC,
    ...overrides,
  });
};

// ---- Tests ----
describe('AudioPlayer', () => {
  beforeEach(() => {
    const RealAudio = window.Audio;
    vi.spyOn(window, 'Audio').mockImplementation(function AudioMock(...args) {
      const el = new RealAudio(...args);
      createdAudios.push(el);
      return el;
    });

    // Stub core media methods
    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => ({}));
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() =>
      Promise.resolve(),
    );
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => ({}));
    // Default media flags
    vi.spyOn(HTMLMediaElement.prototype, 'paused', 'get').mockReturnValue(true);
    vi.spyOn(HTMLMediaElement.prototype, 'ended', 'get').mockReturnValue(false);
    vi.spyOn(HTMLMediaElement.prototype, 'duration', 'get').mockReturnValue(100);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    createdAudios.length = 0;
  });

  it('constructor sets initial state (canPlayRecord & playbackRates)', () => {
    vi.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockReturnValue('maybe');

    const player = makePlayer({ playbackRates: [1, 1.25, 1.5] });

    // State comes from the real StateStore
    expect(player.isPlaying).toBe(false);
    expect(player.canPlayRecord).toBe(true);
    expect(player.currentPlaybackRate).toBe(1);
    expect(player.playbackRates).toEqual([1, 1.25, 1.5]);
    expect(player.src).toBe(SRC);
    expect(player.mimeType).toBe(MIME);
    expect(player.durationSeconds).toBe(100);
    expect(player.state.getLatestValue().durationSeconds).toBe(100);
  });

  it('preloads metadata and updates duration before playback starts', () => {
    const probe = document.createElement('audio');
    const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(probe);
    const durationSpy = vi.spyOn(probe, 'duration', 'get').mockReturnValue(42);

    const player = makePlayer({ durationSeconds: undefined });

    probe.dispatchEvent(new Event('loadedmetadata'));

    expect(createElementSpy).toHaveBeenCalledWith('audio');
    expect(player.durationSeconds).toBe(42);
    expect(player.state.getLatestValue().durationSeconds).toBe(42);

    durationSpy.mockRestore();
  });

  it('constructor marks not playable when mimeType unsupported', () => {
    vi.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockReturnValue('');
    expect(makePlayer({ mimeType: 'audio/unknown' }).canPlayRecord).toBe(false);
  });

  it('canPlayMimeType delegates to elementRef.canPlayType', () => {
    const player = makePlayer();
    // attach an element so canPlayMimeType uses elementRef
    (player as any).ensureElementRef();
    const spy = vi.spyOn(player.elementRef, 'canPlayType').mockReturnValue('probably');
    expect(player.canPlayMimeType('audio/ogg')).toBe(true);
    expect(spy).toHaveBeenCalledWith('audio/ogg');
  });

  it('play() success updates isPlaying and playbackRate', async () => {
    vi.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockReturnValue('maybe');
    const player = makePlayer({ playbackRates: [1, 1.5, 2] });

    await player.play({ currentPlaybackRate: 1.5 });

    expect(player.isPlaying).toBe(true);
    expect(player.currentPlaybackRate).toBe(1.5);
    expect(player.elementRef.playbackRate).toBe(1.5);
    // eslint-disable-next-line no-underscore-dangle
    expect((player as any)._pool.setActiveAudioPlayer).toHaveBeenCalledWith(player);
  });

  it('play() early-return path when element is already playing', async () => {
    const player = makePlayer();

    // Make element look like it's already playing
    vi.spyOn(HTMLMediaElement.prototype, 'paused', 'get').mockReturnValue(false);

    // attach and spy on the concrete element
    (player as any).ensureElementRef();
    const playSpy = vi.spyOn(player.elementRef, 'play');

    await player.play();
    expect(player.isPlaying).toBe(true);
    expect(playSpy).not.toHaveBeenCalled();
  });

  it('play() when not playable triggers registerError {errCode:not-playable}', async () => {
    vi.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockReturnValue('');
    const { onError, plugin } = makeErrorPlugin();
    const player = makePlayer({ mimeType: 'audio/zzz', plugins: [plugin] });
    await player.play();
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ errCode: 'not-playable', player }),
    );
    expect(player.isPlaying).toBe(false);
  });

  it('play() when element.play rejects triggers registerError(error) and isPlaying=false', async () => {
    const { onError, plugin } = makeErrorPlugin();
    const player = makePlayer({ plugins: [plugin] });
    (player as any).ensureElementRef();
    vi.spyOn(player.elementRef, 'play').mockRejectedValueOnce(new Error('x'));
    await player.play();
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ errCode: 'not-playable', player }),
    );
    expect(player.isPlaying).toBe(false);
  });

  it('safety timeout pauses if play did not resolve within 2000ms', async () => {
    vi.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockReturnValue('maybe');
    vi.useFakeTimers({ now: Date.now() });
    const { onError, plugin } = makeErrorPlugin();
    const player = makePlayer({ plugins: [plugin] });

    let resolve;
    // attach and stub play to a pending promise
    (player as any).ensureElementRef();
    vi.spyOn(player.elementRef, 'play').mockImplementation(
      () =>
        new Promise((res) => {
          resolve = res;
        }),
    );
    const pauseSpy = vi.spyOn(player.elementRef!, 'pause').mockImplementation(() => {});

    const playPromise = player.play();
    vi.advanceTimersByTime(2000);
    resolve!();
    expect(pauseSpy).toHaveBeenCalledTimes(1);
    expect(player.isPlaying).toBe(false);
    expect(onError).not.toHaveBeenCalled();

    vi.useRealTimers();
    await Promise.resolve(playPromise);
  });

  it('safety timeout registers failed-to-start if pause throws', () => {
    vi.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockReturnValue('maybe');
    vi.useFakeTimers({ now: Date.now() });
    const { onError, plugin } = makeErrorPlugin();
    const player = makePlayer({ plugins: [plugin] });

    let resolve;
    (player as any).ensureElementRef();
    vi.spyOn(player.elementRef, 'play').mockImplementation(
      () =>
        new Promise((res) => {
          resolve = res;
        }),
    );
    vi.spyOn(player.elementRef, 'pause').mockImplementation(() => {
      throw new Error('nope');
    });

    player.play();
    vi.advanceTimersByTime(2000);
    resolve();
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ errCode: 'failed-to-start', player }),
    );

    vi.useRealTimers();
  });

  it('pause() when element is playing updates state and calls audioElement.pause()', () => {
    const player = makePlayer();
    vi.spyOn(HTMLMediaElement.prototype, 'paused', 'get').mockReturnValue(false);

    (player as any).ensureElementRef();
    const pauseSpy = vi.spyOn(player.elementRef, 'pause');
    player.pause();
    expect(pauseSpy).toHaveBeenCalled();
    expect(player.isPlaying).toBe(false);
  });

  it('pause() when element is not playing does nothing', () => {
    const player = makePlayer();
    (player as any).ensureElementRef();
    const pauseSpy = vi.spyOn(player.elementRef, 'pause');
    player.pause();
    expect(pauseSpy).not.toHaveBeenCalled();
  });

  it('increasePlaybackRate() updates state even before the element is attached', () => {
    const player = makePlayer({ playbackRates: [1, 1.5, 2] });

    expect(player.elementRef).toBeNull();

    player.increasePlaybackRate();

    expect(player.currentPlaybackRate).toBe(1.5);
  });

  it('stop() pauses, resets secondsElapsed and currentTime', () => {
    const player = makePlayer();
    (player as any).ensureElementRef();
    const pauseSpy = vi.spyOn(player, 'pause');
    player.state.partialNext({ secondsElapsed: 50 });
    expect(player.secondsElapsed).toBe(50);

    player.stop();
    expect(pauseSpy).toHaveBeenCalled();
    expect(player.secondsElapsed).toBe(0);
    expect(player.elementRef.currentTime).toBe(0);
  });

  it('togglePlay delegates to play() / pause()', async () => {
    const p = makePlayer();

    const playSpy = vi.spyOn(p, 'play');
    const pauseSpy = vi.spyOn(p, 'pause');

    await p.togglePlay();
    expect(playSpy).toHaveBeenCalled();

    vi.spyOn(HTMLMediaElement.prototype, 'paused', 'get').mockReturnValue(false);
    p.state.partialNext({ isPlaying: true });
    await p.togglePlay();
    expect(pauseSpy).toHaveBeenCalled();
    p.state.partialNext({ isPlaying: false });
  });

  it('increasePlaybackRate cycles through playbackRates', () => {
    const p = makePlayer({ playbackRates: [1, 1.25, 1.5] });
    p.play();
    expect(p.currentPlaybackRate).toBe(1);
    expect(p.elementRef.playbackRate).toBe(1);

    p.increasePlaybackRate();
    expect(p.currentPlaybackRate).toBe(1.25);
    expect(p.elementRef.playbackRate).toBe(1.25);

    p.increasePlaybackRate();
    expect(p.currentPlaybackRate).toBe(1.5);
    expect(p.elementRef.playbackRate).toBe(1.5);

    p.increasePlaybackRate();
    expect(p.currentPlaybackRate).toBe(1);
    expect(p.elementRef.playbackRate).toBe(1);
  });

  it('seek updates currentTime and progress when seekable', () => {
    const p = makePlayer();
    p.play();
    vi.spyOn(p.elementRef, 'duration', 'get').mockReturnValue(120);

    const target = document.createElement('div');
    vi.spyOn(target, 'getBoundingClientRect').mockReturnValue(
      fromPartial<DOMRect>({ width: 100, x: 0 }),
    );

    p.seek({ clientX: 50, currentTarget: target });

    expect(p.elementRef.currentTime).toBeCloseTo(60, 5);
    expect(p.state.getLatestValue().progressPercent).toBeCloseTo(50, 5);
    expect(p.state.getLatestValue().secondsElapsed).toBeCloseTo(60, 5);
  });

  it('seek does nothing if ratio is out of 0..1', () => {
    const p = makePlayer();
    p.play();
    vi.spyOn(p.elementRef, 'duration', 'get').mockReturnValue(120);
    const target = document.createElement('div');
    vi.spyOn(target, 'getBoundingClientRect').mockReturnValue(
      fromPartial<DOMRect>({ width: 100, x: 0 }),
    );

    p.seek({ clientX: 150, currentTarget: target }); // clientX > width
    expect(p.state.getLatestValue().secondsElapsed).toBe(0);
  });

  it('seek emits errCode seek-not-supported when not seekable', () => {
    const { onError, plugin } = makeErrorPlugin();
    const player = makePlayer({ plugins: [plugin] });
    (player as any).ensureElementRef();

    // not seekable
    vi.spyOn(player.elementRef, 'duration', 'get').mockReturnValue(NaN);

    const target = document.createElement('div');
    vi.spyOn(target, 'getBoundingClientRect').mockReturnValue(
      fromPartial<DOMRect>({ width: 100, x: 0 }),
    );

    player.seek({ clientX: 50, currentTarget: target });

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ errCode: 'seek-not-supported', player }),
    );
  });

  it('setSecondsElapsed updates seconds and progressPercent in state', () => {
    const p = makePlayer();
    p.play();
    vi.spyOn(p.elementRef, 'duration', 'get').mockReturnValue(200);

    p.setSecondsElapsed(40);
    const st = p.state.getLatestValue();
    expect(st.secondsElapsed).toBe(40);
    expect(st.progressPercent).toBeCloseTo(20, 5); // 40/200*100
  });

  it('elementIsPlaying utility', () => {
    const el = document.createElement('audio');

    const pausedSpy = vi
      .spyOn(HTMLMediaElement.prototype, 'paused', 'get')
      .mockReturnValue(true);
    const endedSpy = vi
      .spyOn(HTMLMediaElement.prototype, 'ended', 'get')
      .mockReturnValue(false);

    expect(elementIsPlaying(el)).toBe(false);

    pausedSpy.mockReturnValue(false);
    expect(elementIsPlaying(el)).toBe(true);

    endedSpy.mockReturnValue(true);
    expect(elementIsPlaying(el)).toBe(false);
  });

  it('requestRemoval clears element (load not called) and nulls elementRef, notifies plugins', () => {
    const onRemove = vi.fn();
    const player = makePlayer({ plugins: [{ id: 'TestOnRemove', onRemove }] });

    // attach concrete element to spy on load()
    (player as any).ensureElementRef();
    const el = createdAudios[1];
    const loadSpy = vi.spyOn(el, 'load');

    expect(player.elementRef).toBe(el);

    player.requestRemoval();

    expect(loadSpy).not.toHaveBeenCalled();
    expect(player.elementRef).toBeNull();
    expect(onRemove).toHaveBeenCalledWith(expect.objectContaining({ player }));
  });

  it('play() after requestRemoval is a no-op (player disposed)', async () => {
    vi.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockReturnValue('maybe');
    const player = makePlayer();

    // ensure element exists before removal
    (player as any).ensureElementRef();
    const firstEl = createdAudios[1];
    expect(player.elementRef).toBe(firstEl);

    player.requestRemoval();
    expect(player.elementRef).toBeNull();

    await player.play();

    // disposed: play() should not recreate element or change state
    expect(player.elementRef).toBeNull();
    expect(player.isPlaying).toBe(false);
    expect(createdAudios.length).toBe(2);
  });
});
