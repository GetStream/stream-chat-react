import { AudioPlayerPool } from '../AudioPlayerPool';
import { AudioPlaybackArbiter } from '../AudioPlaybackArbiter';

// make throttle a no-op where indirectly used
vi.mock('lodash.throttle', () => ({ default: (fn) => fn }));

describe('AudioPlayerPool', () => {
  const createdAudios = [];

  beforeEach(() => {
    const RealAudio = window.Audio;
    vi.spyOn(window, 'Audio').mockImplementation(function AudioMock(...args) {
      const el = new RealAudio(...args);
      createdAudios.push(el);
      return el;
    });

    vi.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => ({}));
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() =>
      Promise.resolve(),
    );
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => ({}));

    vi.spyOn(HTMLMediaElement.prototype, 'paused', 'get').mockReturnValue(true);
    vi.spyOn(HTMLMediaElement.prototype, 'ended', 'get').mockReturnValue(false);
    vi.spyOn(HTMLMediaElement.prototype, 'duration', 'get').mockReturnValue(100);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    createdAudios.length = 0;
  });
  const defaultDescriptor = { durationSeconds: 100, mimeType: 'audio/mpeg' };
  const makePlayer = (pool, descriptor) =>
    pool.getOrAdd({
      ...defaultDescriptor,
      ...descriptor,
    });

  it('getOrAdd returns same instance for same id and does not auto-register listeners, updates descriptor fields', () => {
    const pool = new AudioPlayerPool();
    const p1 = makePlayer(pool, {
      durationSeconds: 3,
      fileSize: 35,
      id: 'a',
      mimeType: 'audio/abc',
      src: 'https://example.com/a.mp3',
      title: 'Title A',
      waveformData: [1],
    });
    const regSpy = vi.spyOn(p1, 'registerSubscriptions');
    const p1Again = makePlayer(pool, {
      durationSeconds: 10,
      id: 'a',
      mimeType: 'audio/mpeg',
      src: 'https://example.com/b.mp3',
      waveformData: [2],
    });
    expect(p1Again).toBe(p1);
    expect(regSpy).not.toHaveBeenCalled();
    // eslint-disable-next-line no-underscore-dangle
    expect(p1._data).toStrictEqual({
      durationSeconds: 10,
      fileSize: 35,
      id: 'a',
      mimeType: 'audio/mpeg',
      src: 'https://example.com/b.mp3',
      title: 'Title A',
      waveformData: [2],
    });
  });

  it('handoff pauses the previous owner and does not call load() on a src switch', () => {
    const pool = new AudioPlayerPool();
    const p1 = makePlayer(pool, { id: 'o1', src: 'https://example.com/a.mp3' });
    const p2 = makePlayer(pool, { id: 'o2', src: 'https://example.com/b.mp3' });

    const el1 = pool.acquireElement({ owner: p1, src: p1.src });
    const loadSpy = vi.spyOn(el1, 'load');
    const pauseSpyPrev = vi.spyOn(p1, 'pause');
    const releaseForHandoffSpy = vi.spyOn(p1, 'releaseElementForHandoff');

    const el2 = pool.acquireElement({ owner: p2, src: p2.src });
    expect(el2).toBe(el1); // shared element
    expect(pauseSpyPrev).toHaveBeenCalled();
    expect(releaseForHandoffSpy).toHaveBeenCalled();
    expect(loadSpy).not.toHaveBeenCalled();
  });

  it('release keeps the shared instance but clears src and calls load()', () => {
    const pool = new AudioPlayerPool();
    const p1 = makePlayer(pool, { id: 'o1', src: 'https://example.com/a.mp3' });
    const el = pool.acquireElement({ owner: p1, src: p1.src });
    const pauseSpy = vi.spyOn(el, 'pause');
    const loadSpy = vi.spyOn(el, 'load');

    pool.releaseElement(p1);
    expect(pauseSpy).toHaveBeenCalled();
    expect(loadSpy).toHaveBeenCalled();
    expect(el.getAttribute('src')).toBe(null);

    // same shared instance is reused on next acquire
    const elAfter = pool.acquireElement({ owner: p1, src: p1.src });
    expect(elAfter).toBe(el);
  });

  it('registerSubscriptions only calls players that already have an elementRef', () => {
    const pool = new AudioPlayerPool();
    const p1 = makePlayer(pool, { id: 'o1', src: 'https://example.com/a.mp3' });
    const p2 = makePlayer(pool, { id: 'o2', src: 'https://example.com/b.mp3' });

    const spy1 = vi.spyOn(p1, 'registerSubscriptions');
    const spy2 = vi.spyOn(p2, 'registerSubscriptions');

    // give only p2 an elementRef
    const el = document.createElement('audio');
    p2.state.partialNext({ elementRef: el });

    pool.registerSubscriptions();
    expect(spy1).not.toHaveBeenCalled();
    expect(spy2).toHaveBeenCalled();
  });

  it('two pools sharing an arbiter cannot play at once', () => {
    // The reason the arbiter exists: `Channel` and `Thread` mount a pool each, so exclusivity
    // cannot live in the pool. Starting the second player hands the shared element over and
    // pauses the first.
    const arbiter = new AudioPlaybackArbiter();
    const channelPool = new AudioPlayerPool({ arbiter });
    const threadPool = new AudioPlayerPool({ arbiter });

    const inChannel = makePlayer(channelPool, {
      id: 'o1',
      src: 'https://example.com/a.mp3',
    });
    const inThread = makePlayer(threadPool, {
      id: 'o2',
      src: 'https://example.com/b.mp3',
    });

    const channelEl = channelPool.acquireElement({
      owner: inChannel,
      src: inChannel.src,
    });
    const pauseSpy = vi.spyOn(inChannel, 'pause');
    const handoffSpy = vi.spyOn(inChannel, 'releaseElementForHandoff');

    const threadEl = threadPool.acquireElement({ owner: inThread, src: inThread.src });

    expect(threadEl).toBe(channelEl);
    expect(pauseSpy).toHaveBeenCalled();
    expect(handoffSpy).toHaveBeenCalled();
  });

  it('pools sharing an arbiter report the same active player', () => {
    const arbiter = new AudioPlaybackArbiter();
    const channelPool = new AudioPlayerPool({ arbiter });
    const threadPool = new AudioPlayerPool({ arbiter });
    const inThread = makePlayer(threadPool, {
      id: 'o2',
      src: 'https://example.com/b.mp3',
    });

    threadPool.setActiveAudioPlayer(inThread);

    expect(channelPool.activeAudioPlayer).toBe(inThread);
    expect(channelPool.state).toBe(threadPool.state);
  });

  it('pools without a shared arbiter arbitrate alone', () => {
    const poolA = new AudioPlayerPool();
    const poolB = new AudioPlayerPool();
    const a = makePlayer(poolA, { id: 'o1', src: 'https://example.com/a.mp3' });
    const b = makePlayer(poolB, { id: 'o2', src: 'https://example.com/b.mp3' });

    const elA = poolA.acquireElement({ owner: a, src: a.src });
    const pauseSpy = vi.spyOn(a, 'pause');
    const elB = poolB.acquireElement({ owner: b, src: b.src });

    expect(elB).not.toBe(elA);
    expect(pauseSpy).not.toHaveBeenCalled();
  });

  it('removes a player', () => {
    const pool = new AudioPlayerPool();
    const player = makePlayer(pool, { id: 'o1', src: 'https://example.com/a.mp3' });
    pool.acquireElement({ owner: player, src: player.src });
    expect(pool.players).toHaveLength(1);
    pool.remove(player.id);
    expect(pool.players).toHaveLength(0);
  });

  it('sets the active player', () => {
    const pool = new AudioPlayerPool();
    const player = makePlayer(pool, { id: 'o1', src: 'https://example.com/a.mp3' });

    pool.setActiveAudioPlayer(player);
    expect(pool.activeAudioPlayer).toBe(player);

    pool.setActiveAudioPlayer(null);
    expect(pool.activeAudioPlayer).toBeNull();
  });
});
