import { act, renderHook } from '@testing-library/react';

import { useHeardText } from '..';
import type {
  HeardTextFunction,
  HeardTextProgress,
  HeardTextSubscribe,
  UseHeardTextParams,
} from '..';

const TEXT = 'Hello there, how can I help you today?';
const FRAME_MS = 16;

const advance = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms);
  });

const renderHeardText = (initialProps: UseHeardTextParams) =>
  renderHook((props: UseHeardTextParams) => useHeardText(props), { initialProps });

describe('useHeardText', () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: [
        'setTimeout',
        'clearTimeout',
        'setInterval',
        'clearInterval',
        'requestAnimationFrame',
        'cancelAnimationFrame',
        'performance',
        'Date',
      ],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('reveals the text at the pace it is heard', () => {
    const start = performance.now();
    // 20 characters per second
    const heard = vi.fn<HeardTextFunction>((now) => ({
      chars: ((now - start) / 1000) * 20,
      done: false,
    }));
    const { result } = renderHeardText({ heard, text: TEXT });

    expect(result.current.heardText).toBe('');
    expect(result.current.isPaced).toBe(true);

    // requestAnimationFrame fires every 16 ms under fake timers
    advance(512);
    expect(result.current.heardText).toBe(TEXT.slice(0, 10));

    advance(512);
    expect(result.current.heardText).toBe(TEXT.slice(0, 20));

    advance(5000);
    // clamped to the text length, the full text while speech is still in progress
    expect(result.current.heardText).toBe(TEXT);
    expect(heard).toHaveBeenCalledWith(expect.any(Number));
  });

  it('floors fractional character counts', () => {
    const { result } = renderHeardText({
      heard: () => ({ chars: 4.9, done: false }),
      text: TEXT,
    });
    expect(result.current.heardText).toBe(TEXT.slice(0, 4));
  });

  it('treats non-finite and negative counts as nothing heard', () => {
    let progress: HeardTextProgress = { chars: Number.NaN, done: false };
    const { result } = renderHeardText({ heard: () => progress, text: TEXT });
    expect(result.current.heardText).toBe('');

    progress = { chars: -3, done: false };
    advance(FRAME_MS);
    expect(result.current.heardText).toBe('');
  });

  it('never moves the reveal backwards', () => {
    let progress: HeardTextProgress = { chars: 12, done: false };
    const { result } = renderHeardText({ heard: () => progress, text: TEXT });
    expect(result.current.heardText).toBe(TEXT.slice(0, 12));

    progress = { chars: 3, done: false };
    advance(FRAME_MS * 3);
    expect(result.current.heardText).toBe(TEXT.slice(0, 12));

    progress = { chars: 15, done: false };
    advance(FRAME_MS * 2);
    expect(result.current.heardText).toBe(TEXT.slice(0, 15));
  });

  it('reveals the full text once the speech is done and the text is not generating', () => {
    let progress: HeardTextProgress = { chars: 5, done: false };
    const { result } = renderHeardText({ heard: () => progress, text: TEXT });
    expect(result.current.heardText).toBe(TEXT.slice(0, 5));

    progress = { chars: 8, done: true };
    advance(FRAME_MS * 2);
    expect(result.current.heardText).toBe(TEXT);
  });

  it('keeps pacing a done text while it is still generating', () => {
    const heard: HeardTextFunction = () => ({ chars: 8, done: true });
    const { rerender, result } = renderHeardText({ generating: true, heard, text: TEXT });
    expect(result.current.heardText).toBe(TEXT.slice(0, 8));

    rerender({ generating: false, heard, text: TEXT });
    expect(result.current.heardText).toBe(TEXT);
  });

  it('stops ticking once the speech is done', () => {
    const heard = vi.fn<HeardTextFunction>(() => ({ chars: 8, done: true }));
    renderHeardText({ generating: true, heard, text: TEXT });
    const callCount = heard.mock.calls.length;

    advance(FRAME_MS * 20);
    expect(heard).toHaveBeenCalledTimes(callCount);
  });

  it('stops ticking on unmount', () => {
    const heard = vi.fn<HeardTextFunction>(() => ({ chars: 1, done: false }));
    const { unmount } = renderHeardText({ heard, text: TEXT });
    advance(FRAME_MS * 3);
    unmount();
    const callCount = heard.mock.calls.length;

    advance(FRAME_MS * 20);
    expect(heard).toHaveBeenCalledTimes(callCount);
  });

  it('falls back to the timeout when requestAnimationFrame is unavailable', () => {
    vi.stubGlobal('requestAnimationFrame', undefined);
    try {
      let progress: HeardTextProgress = { chars: 2, done: false };
      const { result } = renderHeardText({ heard: () => progress, text: TEXT });
      progress = { chars: 6, done: false };
      advance(FRAME_MS);
      expect(result.current.heardText).toBe(TEXT.slice(0, 6));
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('wakes up when the subscribed source notifies and unsubscribes on unmount', () => {
    let progress: HeardTextProgress = { chars: 2, done: true };
    let notify: (() => void) | undefined;
    const unsubscribe = vi.fn();
    const subscribe = vi.fn<HeardTextSubscribe>((listener) => {
      notify = listener;
      return unsubscribe;
    });
    const { result, unmount } = renderHeardText({
      generating: true,
      heard: () => progress,
      subscribe,
      text: TEXT,
    });
    expect(result.current.heardText).toBe(TEXT.slice(0, 2));

    // settled (done), so no ticking until the source notifies
    progress = { chars: 7, done: false };
    advance(FRAME_MS * 3);
    expect(result.current.heardText).toBe(TEXT.slice(0, 2));

    act(() => notify?.());
    expect(result.current.heardText).toBe(TEXT.slice(0, 7));

    // ticking again
    progress = { chars: 9, done: false };
    advance(FRAME_MS * 2);
    expect(result.current.heardText).toBe(TEXT.slice(0, 9));

    expect(subscribe).toHaveBeenCalledTimes(1);
    unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('is not paced while heard returns undefined', () => {
    const heard = vi.fn<HeardTextFunction>(() => undefined);
    const { rerender, result } = renderHeardText({ heard, text: 'Hello' });
    expect(result.current).toMatchObject({ heardText: 'Hello', isPaced: false });

    // no ticking while not paced
    const callCount = heard.mock.calls.length;
    advance(FRAME_MS * 10);
    expect(heard).toHaveBeenCalledTimes(callCount);

    // re-checked when the text changes
    rerender({ heard, text: 'Hello world' });
    expect(result.current).toMatchObject({ heardText: 'Hello world', isPaced: false });
    expect(heard.mock.calls.length).toBeGreaterThan(callCount);
  });

  it('starts pacing from the length already shown when it becomes paced', () => {
    let progress: HeardTextProgress | undefined;
    let notify: (() => void) | undefined;
    const subscribe: HeardTextSubscribe = (listener) => {
      notify = listener;
      return () => undefined;
    };
    const { rerender, result } = renderHeardText({
      heard: () => progress,
      subscribe,
      text: 'Hello',
    });
    expect(result.current).toMatchObject({ heardText: 'Hello', isPaced: false });

    progress = { chars: 0, done: false };
    act(() => notify?.());
    // paced now, but does not move back past the 5 characters already shown
    expect(result.current).toMatchObject({ heardText: 'Hello', isPaced: true });

    rerender({ heard: () => progress, subscribe, text: 'Hello world' });
    expect(result.current.heardText).toBe('Hello');

    progress = { chars: 8, done: false };
    advance(FRAME_MS);
    expect(result.current.heardText).toBe('Hello wo');
  });

  it('reveals the full text at once when not live', () => {
    const { result } = renderHeardText({
      generating: true,
      heard: () => ({ chars: 0, done: false }),
      live: false,
      text: TEXT,
    });
    expect(result.current).toMatchObject({ heardText: TEXT, isPaced: true });
  });

  it('reads live only once, at mount', () => {
    const heard: HeardTextFunction = () => ({ chars: 3, done: false });
    const { rerender, result } = renderHeardText({ heard, live: true, text: TEXT });
    expect(result.current.heardText).toBe(TEXT.slice(0, 3));

    rerender({ heard, live: false, text: TEXT });
    advance(FRAME_MS);
    expect(result.current.heardText).toBe(TEXT.slice(0, 3));
  });

  it('does not restart pacing when heard and subscribe get a new identity each render', () => {
    let progress: HeardTextProgress = { chars: 4, done: false };
    const unsubscribe = vi.fn();
    const subscribeImpl = vi.fn<HeardTextSubscribe>(() => unsubscribe);
    const props = (): UseHeardTextParams => ({
      // new function identities on every render, as with inline arrow functions
      heard: () => progress,
      subscribe: (listener) => subscribeImpl(listener),
      text: TEXT,
    });
    const { rerender, result } = renderHeardText(props());
    expect(result.current.heardText).toBe(TEXT.slice(0, 4));

    for (let i = 0; i < 5; i++) rerender(props());
    expect(subscribeImpl).toHaveBeenCalledTimes(1);
    expect(unsubscribe).not.toHaveBeenCalled();

    // the latest heard is the one being sampled
    let latest: HeardTextProgress = { chars: 10, done: false };
    rerender({ ...props(), heard: () => latest });
    advance(FRAME_MS);
    expect(result.current.heardText).toBe(TEXT.slice(0, 10));

    latest = { chars: 12, done: false };
    progress = { chars: 1, done: false };
    advance(FRAME_MS);
    expect(result.current.heardText).toBe(TEXT.slice(0, 12));
  });

  it('skip reveals the full text from then on', () => {
    const { result } = renderHeardText({
      heard: () => ({ chars: 3, done: false }),
      text: TEXT,
    });
    expect(result.current.heardText).toBe(TEXT.slice(0, 3));
    const { skip } = result.current;

    act(() => skip());
    expect(result.current.heardText).toBe(TEXT);
    expect(result.current.skip).toBe(skip);

    advance(FRAME_MS * 5);
    expect(result.current.heardText).toBe(TEXT);
  });

  describe('with emoji and other astral characters', () => {
    // waving hand + skin tone modifier, mathematical script X, grinning face, the
    // US flag (two regional indicators) and a BMP character: all but the last are
    // surrogate pairs in UTF-16
    const ASTRAL_TEXT = 'Hi \u{1F44B}\u{1F3FD} \u{1D4B3}\u{1F600}!\u{1F1FA}\u{1F1F8}é';
    const CODE_POINTS = Array.from(ASTRAL_TEXT);
    const LONE_SURROGATE =
      /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/;

    it('counts chars in code points, not UTF-16 code units', () => {
      expect(CODE_POINTS.length).toBeLessThan(ASTRAL_TEXT.length);
      let progress: HeardTextProgress = { chars: 0, done: false };
      const { result } = renderHeardText({ heard: () => progress, text: ASTRAL_TEXT });

      for (let chars = 1; chars <= CODE_POINTS.length; chars++) {
        progress = { chars, done: false };
        advance(FRAME_MS);
        expect(result.current.heardText).toBe(CODE_POINTS.slice(0, chars).join(''));
        expect(result.current.heardText).not.toMatch(LONE_SURROGATE);
      }
      // the whole text once chars reaches the code point length, still speaking
      expect(result.current.heardText).toBe(ASTRAL_TEXT);
    });

    it('never produces a lone surrogate for fractional or time based progress', () => {
      const start = performance.now();
      // 7.3 code points per second
      const { result } = renderHeardText({
        heard: (now) => ({ chars: ((now - start) / 1000) * 7.3, done: false }),
        text: ASTRAL_TEXT,
      });

      for (let frame = 0; frame < 150; frame++) {
        advance(FRAME_MS);
        expect(result.current.heardText).not.toMatch(LONE_SURROGATE);
        expect(ASTRAL_TEXT.startsWith(result.current.heardText)).toBe(true);
      }
      expect(result.current.heardText).toBe(ASTRAL_TEXT);
    });

    it('reveals the full text when chars exceeds the code point length', () => {
      const { result } = renderHeardText({
        heard: () => ({ chars: ASTRAL_TEXT.length + 10, done: false }),
        text: ASTRAL_TEXT,
      });
      expect(result.current.heardText).toBe(ASTRAL_TEXT);
    });

    it('never moves the reveal backwards in code points', () => {
      let progress: HeardTextProgress = { chars: 6, done: false };
      const { result } = renderHeardText({ heard: () => progress, text: ASTRAL_TEXT });
      expect(result.current.heardText).toBe(CODE_POINTS.slice(0, 6).join(''));

      progress = { chars: 2, done: false };
      advance(FRAME_MS * 3);
      expect(result.current.heardText).toBe(CODE_POINTS.slice(0, 6).join(''));
    });

    it('keeps code point boundaries when the text grows', () => {
      const heard: HeardTextFunction = () => ({ chars: 5, done: false });
      const { rerender, result } = renderHeardText({
        heard,
        text: '\u{1F600}\u{1F600}',
      });
      expect(result.current.heardText).toBe('\u{1F600}\u{1F600}');

      rerender({
        heard,
        text: '\u{1F600}\u{1F600}\u{1F44B}\u{1F44B}\u{1F44B}\u{1F44B}',
      });
      advance(FRAME_MS);
      expect(result.current.heardText).toBe(
        '\u{1F600}\u{1F600}\u{1F44B}\u{1F44B}\u{1F44B}',
      );
    });
  });
});
