import { act, renderHook } from '@testing-library/react';

import { useAnnouncementQueue } from '../useAnnouncementQueue';

describe('useAnnouncementQueue', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('announces the first enqueued item immediately', () => {
    const announce = vi.fn();
    const { result } = renderHook(() => useAnnouncementQueue(announce, { gapMs: 100 }));

    act(() => result.current.enqueue({ message: 'one', priority: 'polite' }));

    expect(announce).toHaveBeenCalledTimes(1);
    expect(announce).toHaveBeenCalledWith('one', { priority: 'polite' });
  });

  it('paces subsequent items by gapMs and preserves order', () => {
    const announce = vi.fn();
    const { result } = renderHook(() => useAnnouncementQueue(announce, { gapMs: 100 }));

    act(() => {
      result.current.enqueue({ message: 'one' });
      result.current.enqueue({ message: 'two' });
      result.current.enqueue({ message: 'three' });
    });

    expect(announce.mock.calls.map((c) => c[0])).toEqual(['one']);

    act(() => vi.advanceTimersByTime(100));
    expect(announce.mock.calls.map((c) => c[0])).toEqual(['one', 'two']);

    act(() => vi.advanceTimersByTime(100));
    expect(announce.mock.calls.map((c) => c[0])).toEqual(['one', 'two', 'three']);

    // No further announcements once the queue is drained.
    act(() => vi.advanceTimersByTime(500));
    expect(announce).toHaveBeenCalledTimes(3);
  });

  it('uses the latest announce without resetting the queue', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender, result } = renderHook(
      ({ announce }) => useAnnouncementQueue(announce, { gapMs: 100 }),
      { initialProps: { announce: first } },
    );

    act(() => {
      result.current.enqueue({ message: 'a' });
      result.current.enqueue({ message: 'b' });
    });
    rerender({ announce: second });

    act(() => vi.advanceTimersByTime(100));

    expect(first).toHaveBeenCalledWith('a', { priority: undefined });
    expect(second).toHaveBeenCalledWith('b', { priority: undefined });
  });

  it('stops announcing and clears pending timers after unmount', () => {
    const announce = vi.fn();
    const { result, unmount } = renderHook(() =>
      useAnnouncementQueue(announce, { gapMs: 100 }),
    );

    act(() => {
      result.current.enqueue({ message: 'one' });
      result.current.enqueue({ message: 'two' });
    });
    expect(announce).toHaveBeenCalledTimes(1);

    unmount();
    act(() => vi.advanceTimersByTime(1000));

    expect(announce).toHaveBeenCalledTimes(1);
  });
});
