import { AudioPlayer, elementIsPlaying } from '../AudioPlayer';

// ---- Keep throttle synchronous so seek assertions are deterministic ----
jest.mock('lodash.throttle', () => (fn) => fn);

// ---- Stable console noise filter (optional) ----
const originalConsoleError = console.error;
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation((...args) => {
    const msg = String(args[0]?.message ?? args[0] ?? '');
    if (/Not implemented/i.it(msg)) return;
    originalConsoleError(...args);
  });
});

// ---- Helpers ----
const SRC = 'https://example.com/a.mp3';
const MIME = 'audio/mpeg';

const createdAudios = [];
const makeErrorPlugin = () => {
  const onError = jest.fn();
  return {
    onError,
    plugin: { id: 'TestErrorPlugin', onError },
  };
};

const makePlayer = (overrides = {}) =>
  new AudioPlayer({
    durationSeconds: 100,
    id: 'id-1',
    mimeType: MIME,
    src: SRC,
    ...overrides,
  });

// ---- Tests ----
describe('AudioPlayer', () => {
  beforeEach(() => {
    const RealAudio = window.Audio;
    jest.spyOn(window, 'Audio').mockImplementation(function AudioMock(...args) {
      const el = new RealAudio(...args);
      createdAudios.push(el);
      return el;
    });

    // Stub core media methods
    jest.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => ({}));
    jest
      .spyOn(HTMLMediaElement.prototype, 'play')
      .mockImplementation(() => Promise.resolve());
    jest.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => ({}));
    // Default media flags
    jest.spyOn(HTMLMediaElement.prototype, 'paused', 'get').mockReturnValue(true);
    jest.spyOn(HTMLMediaElement.prototype, 'ended', 'get').mockReturnValue(false);
    jest.spyOn(HTMLMediaElement.prototype, 'duration', 'get').mockReturnValue(100);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    createdAudios.length = 0;
  });

  it('constructor sets initial state (canPlayRecord & playbackRates)', () => {
    jest.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockReturnValue('maybe');

    const player = makePlayer({ playbackRates: [1, 1.25, 1.5] });

    // State comes from the real StateStore
    expect(player.isPlaying).toBe(false);
    expect(player.canPlayRecord).toBe(true);
    expect(player.currentPlaybackRate).toBe(1);
    expect(player.playbackRates).toEqual([1, 1.25, 1.5]);
    expect(player.src).toBe(SRC);
    expect(player.mimeType).toBe(MIME);
    expect(player.durationSeconds).toBe(100);
  });

  it('constructor marks not playable when mimeType unsupported', () => {
    jest.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockReturnValue('');
    expect(makePlayer({ mimeType: 'audio/unknown' }).canPlayRecord).toBe(false);
  });

  it('canPlayMimeType delegates to elementRef.canPlayType', () => {
    const player = makePlayer();
    const spy = jest.spyOn(player.elementRef, 'canPlayType').mockReturnValue('probably');
    expect(player.canPlayMimeType('audio/ogg')).toBe(true);
    expect(spy).toHaveBeenCalledWith('audio/ogg');
  });

  it('play() success updates isPlaying and playbackRate', async () => {
    jest.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockReturnValue('maybe');
    const player = makePlayer({ playbackRates: [1, 1.5, 2] });

    await player.play({ currentPlaybackRate: 1.5 });

    expect(player.isPlaying).toBe(true);
    expect(player.currentPlaybackRate).toBe(1.5);
    expect(player.elementRef.playbackRate).toBe(1.5);
  });

  it('play() early-return path when element is already playing', async () => {
    const player = makePlayer();

    // Make element look like it's already playing
    jest.spyOn(HTMLMediaElement.prototype, 'paused', 'get').mockReturnValue(false);

    const playSpy = jest.spyOn(player.elementRef, 'play');

    await player.play();
    expect(player.isPlaying).toBe(true);
    expect(playSpy).not.toHaveBeenCalled();
  });

  it('play() when not playable triggers registerError {errCode:not-playable}', async () => {
    jest.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockReturnValue('');
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
    jest.spyOn(player.elementRef, 'play').mockRejectedValueOnce(new Error('x'));
    await player.play();
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ errCode: 'not-playable', player }),
    );
    expect(player.isPlaying).toBe(false);
  });

  it('safety timeout pauses if play did not resolve within 2000ms', async () => {
    jest.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockReturnValue('maybe');
    jest.useFakeTimers({ now: Date.now() });
    const { onError, plugin } = makeErrorPlugin();
    const player = makePlayer({ plugins: [plugin] });

    let resolve;
    jest.spyOn(player.elementRef, 'play').mockImplementation(
      () =>
        new Promise((res) => {
          resolve = res;
        }),
    );
    const pauseSpy = jest.spyOn(player.elementRef, 'pause').mockImplementation();

    const playPromise = player.play();
    jest.advanceTimersByTime(2000);
    resolve();
    expect(pauseSpy).toHaveBeenCalledTimes(1);
    expect(player.isPlaying).toBe(false);
    expect(onError).not.toHaveBeenCalled();

    jest.useRealTimers();
    await Promise.resolve(playPromise);
  });

  it('safety timeout registers failed-to-start if pause throws', () => {
    jest.spyOn(HTMLMediaElement.prototype, 'canPlayType').mockReturnValue('maybe');
    jest.useFakeTimers({ now: Date.now() });
    const { onError, plugin } = makeErrorPlugin();
    const player = makePlayer({ plugins: [plugin] });

    let resolve;
    jest.spyOn(player.elementRef, 'play').mockImplementation(
      () =>
        new Promise((res) => {
          resolve = res;
        }),
    );
    jest.spyOn(player.elementRef, 'pause').mockImplementation(() => {
      throw new Error('nope');
    });

    player.play();
    jest.advanceTimersByTime(2000);
    resolve();
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ errCode: 'failed-to-start', player }),
    );

    jest.useRealTimers();
  });

  it('pause() when element is playing updates state and calls audioElement.pause()', () => {
    const player = makePlayer();
    jest.spyOn(HTMLMediaElement.prototype, 'paused', 'get').mockReturnValue(false);

    const pauseSpy = jest.spyOn(player.elementRef, 'pause');
    player.pause();
    expect(pauseSpy).toHaveBeenCalled();
    expect(player.isPlaying).toBe(false);
  });

  it('pause() when element is not playing does nothing', () => {
    const player = makePlayer();
    const pauseSpy = jest.spyOn(player.elementRef, 'pause');
    player.pause();
    expect(pauseSpy).not.toHaveBeenCalled();
  });

  it('stop() pauses, resets secondsElapsed and currentTime', () => {
    const player = makePlayer();
    const pauseSpy = jest.spyOn(player, 'pause');
    player.state.partialNext({ secondsElapsed: 50 });
    expect(player.secondsElapsed).toBe(50);

    player.stop();
    expect(pauseSpy).toHaveBeenCalled();
    expect(player.secondsElapsed).toBe(0);
    expect(player.elementRef.currentTime).toBe(0);
  });

  it('togglePlay delegates to play() / pause()', async () => {
    const p = makePlayer();

    const playSpy = jest.spyOn(p, 'play');
    const pauseSpy = jest.spyOn(p, 'pause');

    await p.togglePlay();
    expect(playSpy).toHaveBeenCalled();

    jest.spyOn(HTMLMediaElement.prototype, 'paused', 'get').mockReturnValue(false);
    p.state.partialNext({ isPlaying: true });
    await p.togglePlay();
    expect(pauseSpy).toHaveBeenCalled();
    p.state.partialNext({ isPlaying: false });
  });

  it('increasePlaybackRate cycles through playbackRates', () => {
    const p = makePlayer({ playbackRates: [1, 1.25, 1.5] });
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
    jest.spyOn(p.elementRef, 'duration', 'get').mockReturnValue(120);

    const target = document.createElement('div');
    jest.spyOn(target, 'getBoundingClientRect').mockReturnValue({ width: 100, x: 0 });

    p.seek({ clientX: 50, currentTarget: target });

    expect(p.elementRef.currentTime).toBeCloseTo(60, 5);
    expect(p.state.getLatestValue().progressPercent).toBeCloseTo(50, 5);
    expect(p.state.getLatestValue().secondsElapsed).toBeCloseTo(60, 5);
  });

  it('seek does nothing if ratio is out of 0..1', () => {
    const p = makePlayer();
    jest.spyOn(p.elementRef, 'duration', 'get').mockReturnValue(120);
    const target = document.createElement('div');
    jest.spyOn(target, 'getBoundingClientRect').mockReturnValue({ width: 100, x: 0 });

    p.seek({ clientX: 150, currentTarget: target }); // clientX > width
    expect(p.state.getLatestValue().secondsElapsed).toBe(0);
  });

  it('seek emits errCode seek-not-supported when not seekable', () => {
    const { onError, plugin } = makeErrorPlugin();
    const player = makePlayer({ plugins: [plugin] });

    // not seekable
    jest.spyOn(player.elementRef, 'duration', 'get').mockReturnValue(NaN);

    const target = document.createElement('div');
    jest.spyOn(target, 'getBoundingClientRect').mockReturnValue({ width: 100, x: 0 });

    player.seek({ clientX: 50, currentTarget: target });

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ errCode: 'seek-not-supported', player }),
    );
  });

  it('setSecondsElapsed updates seconds and progressPercent in state', () => {
    const p = makePlayer();
    jest.spyOn(p.elementRef, 'duration', 'get').mockReturnValue(200);

    p.setSecondsElapsed(40);
    const st = p.state.getLatestValue();
    expect(st.secondsElapsed).toBe(40);
    expect(st.progressPercent).toBeCloseTo(20, 5); // 40/200*100
  });

  it('elementIsPlaying utility', () => {
    const el = document.createElement('audio');

    const pausedSpy = jest
      .spyOn(HTMLMediaElement.prototype, 'paused', 'get')
      .mockReturnValue(true);
    const endedSpy = jest
      .spyOn(HTMLMediaElement.prototype, 'ended', 'get')
      .mockReturnValue(false);

    expect(elementIsPlaying(el)).toBe(false);

    pausedSpy.mockReturnValue(false);
    expect(elementIsPlaying(el)).toBe(true);

    endedSpy.mockReturnValue(true);
    expect(elementIsPlaying(el)).toBe(false);
  });
});
