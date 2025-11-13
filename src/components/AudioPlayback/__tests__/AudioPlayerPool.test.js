import { AudioPlayerPool } from '../AudioPlayerPool';

// make throttle a no-op where indirectly used
jest.mock('lodash.throttle', () => (fn) => fn);

describe('AudioPlayerPool', () => {
  const createdAudios = [];

  beforeEach(() => {
    const RealAudio = window.Audio;
    jest.spyOn(window, 'Audio').mockImplementation(function AudioMock(...args) {
      const el = new RealAudio(...args);
      createdAudios.push(el);
      return el;
    });

    jest.spyOn(HTMLMediaElement.prototype, 'load').mockImplementation(() => ({}));
    jest
      .spyOn(HTMLMediaElement.prototype, 'play')
      .mockImplementation(() => Promise.resolve());
    jest.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => ({}));

    jest.spyOn(HTMLMediaElement.prototype, 'paused', 'get').mockReturnValue(true);
    jest.spyOn(HTMLMediaElement.prototype, 'ended', 'get').mockReturnValue(false);
    jest.spyOn(HTMLMediaElement.prototype, 'duration', 'get').mockReturnValue(100);
  });

  afterEach(() => {
    jest.restoreAllMocks();
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
    const regSpy = jest.spyOn(p1, 'registerSubscriptions');
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

  it('concurrent mode: per-owner elements are created lazily; src set without explicit load()', () => {
    const pool = new AudioPlayerPool({ allowConcurrentPlayback: true });
    const p1 = makePlayer(pool, { id: 'o1', src: 'https://example.com/a.mp3' });
    const p2 = makePlayer(pool, { id: 'o2', src: 'https://example.com/b.mp3' });

    const el1 = pool.acquireElement({ ownerId: p1.id, src: p1.src });
    const el2 = pool.acquireElement({ ownerId: p2.id, src: p2.src });
    expect(el1).toBeInstanceOf(HTMLAudioElement);
    expect(el2).toBeInstanceOf(HTMLAudioElement);
    expect(el1).not.toBe(el2);

    const loadSpy1 = jest.spyOn(el1, 'load');
    const loadSpy2 = jest.spyOn(el2, 'load');

    // change sources; pool should set src but not call load()
    const el1again = pool.acquireElement({
      ownerId: p1.id,
      src: 'https://example.com/a2.mp3',
    });
    const el2again = pool.acquireElement({
      ownerId: p2.id,
      src: 'https://example.com/b2.mp3',
    });
    expect(el1again).toBe(el1);
    expect(el2again).toBe(el2);
    expect(loadSpy1).not.toHaveBeenCalled();
    expect(loadSpy2).not.toHaveBeenCalled();
  });

  it('concurrent mode: releaseElement pauses, clears src, calls load, and allows recreation', () => {
    const pool = new AudioPlayerPool({ allowConcurrentPlayback: true });
    const p1 = makePlayer(pool, { id: 'o1', src: 'https://example.com/a.mp3' });
    const el1 = pool.acquireElement({ ownerId: p1.id, src: p1.src });
    const pauseSpy = jest.spyOn(el1, 'pause');
    const loadSpy = jest.spyOn(el1, 'load');

    pool.releaseElement(p1.id);
    expect(pauseSpy).toHaveBeenCalled();
    expect(loadSpy).toHaveBeenCalled();
    expect(el1.getAttribute('src')).toBe(null);

    // re-acquire -> new element instance is created
    const el1new = pool.acquireElement({ ownerId: p1.id, src: p1.src });
    expect(el1new).toBeInstanceOf(HTMLAudioElement);
    expect(el1new).not.toBe(el1);
  });

  it('single-playback mode: handoff pauses previous owner and does not call load() on src switch', () => {
    const pool = new AudioPlayerPool({ allowConcurrentPlayback: false });
    const p1 = makePlayer(pool, { id: 'o1', src: 'https://example.com/a.mp3' });
    const p2 = makePlayer(pool, { id: 'o2', src: 'https://example.com/b.mp3' });

    const el1 = pool.acquireElement({ ownerId: p1.id, src: p1.src });
    const loadSpy = jest.spyOn(el1, 'load');
    const pauseSpyPrev = jest.spyOn(p1, 'pause');
    const releaseForHandoffSpy = jest.spyOn(p1, 'releaseElementForHandoff');

    const el2 = pool.acquireElement({ ownerId: p2.id, src: p2.src });
    expect(el2).toBe(el1); // shared element
    expect(pauseSpyPrev).toHaveBeenCalled();
    expect(releaseForHandoffSpy).toHaveBeenCalled();
    expect(loadSpy).not.toHaveBeenCalled();
  });

  it('single-playback mode: release keeps shared instance but clears src and calls load()', () => {
    const pool = new AudioPlayerPool({ allowConcurrentPlayback: false });
    const p1 = makePlayer(pool, { id: 'o1', src: 'https://example.com/a.mp3' });
    const el = pool.acquireElement({ ownerId: p1.id, src: p1.src });
    const pauseSpy = jest.spyOn(el, 'pause');
    const loadSpy = jest.spyOn(el, 'load');

    pool.releaseElement(p1.id);
    expect(pauseSpy).toHaveBeenCalled();
    expect(loadSpy).toHaveBeenCalled();
    expect(el.getAttribute('src')).toBe(null);

    // same shared instance is reused on next acquire
    const elAfter = pool.acquireElement({ ownerId: p1.id, src: p1.src });
    expect(elAfter).toBe(el);
  });

  it('registerSubscriptions only calls players that already have an elementRef', () => {
    const pool = new AudioPlayerPool({ allowConcurrentPlayback: true });
    const p1 = makePlayer(pool, { id: 'o1', src: 'https://example.com/a.mp3' });
    const p2 = makePlayer(pool, { id: 'o2', src: 'https://example.com/b.mp3' });

    const spy1 = jest.spyOn(p1, 'registerSubscriptions');
    const spy2 = jest.spyOn(p2, 'registerSubscriptions');

    // give only p2 an elementRef
    const el = document.createElement('audio');
    p2.state.partialNext({ elementRef: el });

    pool.registerSubscriptions();
    expect(spy1).not.toHaveBeenCalled();
    expect(spy2).toHaveBeenCalled();
  });

  it('single-playback mode: removes a player', () => {
    const pool = new AudioPlayerPool({ allowConcurrentPlayback: false });
    const player = makePlayer(pool, { id: 'o1', src: 'https://example.com/a.mp3' });
    pool.acquireElement({ ownerId: player.id, src: player.src });
    expect(pool.players).toHaveLength(1);
    expect(Object.keys(pool.audios)).toHaveLength(0);
    pool.remove(player.id);
    expect(pool.players).toHaveLength(0);
  });

  it('concurrent-playback mode: removes a player', () => {
    const pool = new AudioPlayerPool({ allowConcurrentPlayback: true });
    const player = makePlayer(pool, { id: 'o1', src: 'https://example.com/a.mp3' });
    const element = pool.acquireElement({ ownerId: player.id, src: player.src });
    expect(pool.players).toHaveLength(1);
    expect(pool.audios.get(player.id)).toBe(element);
    pool.remove(player.id);
    expect(pool.players).toHaveLength(0);
    expect(Object.keys(pool.audios)).toHaveLength(0);
  });

  it('sets active player only in single-playback mode', () => {
    const poolConcurrent = new AudioPlayerPool({ allowConcurrentPlayback: true });
    const player1 = makePlayer(poolConcurrent, {
      id: 'o1',
      src: 'https://example.com/a.mp3',
    });
    const poolSingle = new AudioPlayerPool({ allowConcurrentPlayback: false });
    const player2 = makePlayer(poolSingle, {
      id: 'o1',
      src: 'https://example.com/b.mp3',
    });
    poolConcurrent.setActiveAudioPlayer(player1);
    expect(poolConcurrent.players).toHaveLength(1);
    expect(poolConcurrent.activeAudioPlayer).toBeNull();
    poolSingle.setActiveAudioPlayer(player2);
    expect(poolSingle.players).toHaveLength(1);
    expect(poolSingle.activeAudioPlayer).toBe(player2);
  });
});
