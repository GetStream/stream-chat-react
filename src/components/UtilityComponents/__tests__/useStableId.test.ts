import { renderHook } from '@testing-library/react';

import { useStableId } from '../useStableId';

describe('useStableId', () => {
  it('returns a non-empty string', () => {
    const { result } = renderHook(() => useStableId());
    expect(typeof result.current).toBe('string');
    expect(result.current.length).toBeGreaterThan(0);
  });

  it('is stable across re-renders', () => {
    const { rerender, result } = renderHook(() => useStableId());
    const initial = result.current;
    rerender();
    rerender();
    expect(result.current).toBe(initial);
  });

  it('returns distinct values from two hook calls in the same component', () => {
    const { result } = renderHook(() => [useStableId(), useStableId()] as const);
    expect(result.current[0]).not.toBe(result.current[1]);
  });

  it('never contains a colon (so it is safe as an HTML id)', () => {
    const { result } = renderHook(() => useStableId());
    expect(result.current).not.toContain(':');
  });
});
