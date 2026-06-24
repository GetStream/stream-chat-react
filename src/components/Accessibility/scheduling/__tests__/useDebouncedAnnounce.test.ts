import { act, renderHook } from '@testing-library/react';

import { useDebouncedAnnounce } from '../useDebouncedAnnounce';

describe('useDebouncedAnnounce', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('announces only the last call on a key within its delay window', () => {
    const announce = vi.fn();
    const { result } = renderHook(() => useDebouncedAnnounce(announce));

    act(() => {
      result.current.announce('a', 'one', 300, 'polite');
      result.current.announce('a', 'two', 300, 'polite');
      result.current.announce('a', 'three', 300, 'assertive');
    });
    expect(announce).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(300));

    expect(announce).toHaveBeenCalledTimes(1);
    expect(announce).toHaveBeenCalledWith('three', 'assertive');
  });

  it('debounces distinct keys independently, each with its own delay', () => {
    const announce = vi.fn();
    const { result } = renderHook(() => useDebouncedAnnounce(announce));

    act(() => {
      result.current.announce('short', 'fast', 200, 'polite');
      result.current.announce('long', 'slow', 500, 'polite');
    });

    // The shorter key fires first; the longer key is still pending.
    act(() => vi.advanceTimersByTime(200));
    expect(announce).toHaveBeenCalledTimes(1);
    expect(announce).toHaveBeenCalledWith('fast', 'polite');

    // Scheduling 'short' did not cancel 'long'.
    act(() => vi.advanceTimersByTime(300));
    expect(announce).toHaveBeenCalledTimes(2);
    expect(announce).toHaveBeenLastCalledWith('slow', 'polite');
  });

  it('cancel(key) cancels only that key', () => {
    const announce = vi.fn();
    const { result } = renderHook(() => useDebouncedAnnounce(announce));

    act(() => {
      result.current.announce('a', 'a-msg', 300);
      result.current.announce('b', 'b-msg', 300);
      result.current.cancel('a');
      vi.advanceTimersByTime(300);
    });

    expect(announce).toHaveBeenCalledTimes(1);
    expect(announce).toHaveBeenCalledWith('b-msg', undefined);
  });

  it('cancel() with no key cancels all pending announcements', () => {
    const announce = vi.fn();
    const { result } = renderHook(() => useDebouncedAnnounce(announce));

    act(() => {
      result.current.announce('a', 'a-msg', 300);
      result.current.announce('b', 'b-msg', 300);
      result.current.cancel();
      vi.advanceTimersByTime(300);
    });

    expect(announce).not.toHaveBeenCalled();
  });

  it('uses the latest announce without resetting timers', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender, result } = renderHook(
      ({ announce }) => useDebouncedAnnounce(announce),
      { initialProps: { announce: first } },
    );

    act(() => result.current.announce('a', 'msg', 300));
    rerender({ announce: second });
    act(() => vi.advanceTimersByTime(300));

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith('msg', undefined);
  });

  it('clears all pending timers on unmount', () => {
    const announce = vi.fn();
    const { result, unmount } = renderHook(() => useDebouncedAnnounce(announce));

    act(() => {
      result.current.announce('a', 'a-msg', 300);
      result.current.announce('b', 'b-msg', 300);
    });
    unmount();
    act(() => vi.advanceTimersByTime(300));

    expect(announce).not.toHaveBeenCalled();
  });
});
