import { act, renderHook } from '@testing-library/react';
import { useDebouncedValue } from '../useDebouncedValue';

describe('useDebouncedValue', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebouncedValue('a', 100));
    expect(result.current).toBe('a');
  });

  it('updates to the latest value only after the delay elapses', () => {
    const { rerender, result } = renderHook(({ v }) => useDebouncedValue(v, 100), {
      initialProps: { v: 'a' },
    });

    rerender({ v: 'b' });
    expect(result.current).toBe('a'); // not yet

    act(() => vi.advanceTimersByTime(100));
    expect(result.current).toBe('b');
  });

  it('collapses rapid changes, emitting only the final value', () => {
    const { rerender, result } = renderHook(({ v }) => useDebouncedValue(v, 100), {
      initialProps: { v: 'a' },
    });

    rerender({ v: 'ab' });
    act(() => vi.advanceTimersByTime(50));
    rerender({ v: 'abc' });
    act(() => vi.advanceTimersByTime(50)); // only 50ms since 'abc' → still stale
    expect(result.current).toBe('a');

    act(() => vi.advanceTimersByTime(50)); // now 100ms since 'abc'
    expect(result.current).toBe('abc'); // intermediate 'ab' was skipped
  });
});
