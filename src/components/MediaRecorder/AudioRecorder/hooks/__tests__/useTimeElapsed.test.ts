import { act, renderHook } from '@testing-library/react';

import { useTimeElapsed } from '../useTimeElapsed';

describe('useTimeElapsed', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('counts one second per second after startCounter() until stopCounter()', () => {
    const { result } = renderHook(() => useTimeElapsed());

    act(() => result.current.startCounter());
    act(() => vi.advanceTimersByTime(3000));
    expect(result.current.secondsElapsed).toBe(3);

    act(() => result.current.stopCounter());
    act(() => vi.advanceTimersByTime(3000));
    expect(result.current.secondsElapsed).toBe(3);
  });

  it('stops counting on unmount when started with startOnMount', () => {
    const { unmount } = renderHook(() => useTimeElapsed({ startOnMount: true }));
    expect(vi.getTimerCount()).toBe(1);

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });

  it('stops counting on unmount when started with startCounter()', () => {
    const { result, unmount } = renderHook(() => useTimeElapsed());
    act(() => result.current.startCounter());
    expect(vi.getTimerCount()).toBe(1);

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});
