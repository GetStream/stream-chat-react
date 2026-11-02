import { act, renderHook } from '@testing-library/react';

import { useIsScrolling } from '../useIsScrolling';

const IDLE_MS = 1000;

describe('useIsScrolling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('is false until the element scrolls', () => {
    const element = document.createElement('div');
    const { result } = renderHook(() => useIsScrolling(element, IDLE_MS));

    expect(result.current).toBe(false);
  });

  it('is true while scroll events keep arriving and false once they stop for idleMs', () => {
    const element = document.createElement('div');
    const { result } = renderHook(() => useIsScrolling(element, IDLE_MS));

    act(() => {
      element.dispatchEvent(new Event('scroll'));
    });
    expect(result.current).toBe(true);

    act(() => {
      vi.advanceTimersByTime(IDLE_MS - 1);
      element.dispatchEvent(new Event('scroll'));
      vi.advanceTimersByTime(IDLE_MS - 1);
    });
    expect(result.current).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toBe(false);
  });

  it('is false for a replaced element that has not scrolled yet', () => {
    const first = document.createElement('div');
    const second = document.createElement('div');
    const { rerender, result } = renderHook(
      ({ element }) => useIsScrolling(element, IDLE_MS),
      { initialProps: { element: first } },
    );

    act(() => {
      first.dispatchEvent(new Event('scroll'));
    });
    expect(result.current).toBe(true);

    rerender({ element: second });
    expect(result.current).toBe(false);
  });

  it('clears its idle timer when unmounted mid-scroll', () => {
    const element = document.createElement('div');
    const { result, unmount } = renderHook(() => useIsScrolling(element, IDLE_MS));

    act(() => {
      element.dispatchEvent(new Event('scroll'));
    });
    expect(result.current).toBe(true);

    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('is false after the element is swapped out mid-scroll and back again', () => {
    const element = document.createElement('div');
    const { rerender, result } = renderHook(
      ({ current }) => useIsScrolling(current, IDLE_MS),
      { initialProps: { current: element as HTMLElement | null } },
    );

    act(() => {
      element.dispatchEvent(new Event('scroll'));
    });
    rerender({ current: null });
    rerender({ current: element });

    expect(result.current).toBe(false);
  });

  it('is false without an element', () => {
    const { result } = renderHook(() => useIsScrolling(null, IDLE_MS));

    expect(result.current).toBe(false);
  });
});
