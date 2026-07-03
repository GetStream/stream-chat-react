import { act, renderHook } from '@testing-library/react';
import { useFrequentlyUsedEmoji } from '../useFrequentlyUsedEmoji';

describe('useFrequentlyUsedEmoji', () => {
  it('tracks recents most-recent-first and de-duplicates (uncontrolled)', () => {
    const { result } = renderHook(() => useFrequentlyUsedEmoji({}));
    act(() => result.current.recordUse('a'));
    act(() => result.current.recordUse('b'));
    act(() => result.current.recordUse('a'));
    expect(result.current.frequentlyUsedIds).toEqual(['a', 'b']);
  });

  it('notifies via onFrequentlyUsedChange and stays controlled', () => {
    const onFrequentlyUsedChange = vi.fn();
    const { rerender, result } = renderHook(
      ({ frequentlyUsedEmoji }) =>
        useFrequentlyUsedEmoji({ frequentlyUsedEmoji, onFrequentlyUsedChange }),
      { initialProps: { frequentlyUsedEmoji: ['x'] } },
    );
    act(() => result.current.recordUse('y'));
    expect(onFrequentlyUsedChange).toHaveBeenCalledWith(['y', 'x']);
    expect(result.current.frequentlyUsedIds).toEqual(['x']); // controlled: reflects prop only
    rerender({ frequentlyUsedEmoji: ['y', 'x'] });
    expect(result.current.frequentlyUsedIds).toEqual(['y', 'x']);
  });

  it('keeps both when two emoji are recorded before a re-render (uncontrolled)', () => {
    const { result } = renderHook(() => useFrequentlyUsedEmoji({}));
    // Two selects in the same tick close over the same list — the second must still
    // build on the first, not overwrite it.
    act(() => {
      result.current.recordUse('a');
      result.current.recordUse('b');
    });
    expect(result.current.frequentlyUsedIds).toEqual(['b', 'a']);
  });

  it('accumulates both when two emoji are recorded before a re-render (controlled)', () => {
    const onFrequentlyUsedChange = vi.fn();
    const { result } = renderHook(() =>
      useFrequentlyUsedEmoji({ frequentlyUsedEmoji: [], onFrequentlyUsedChange }),
    );
    act(() => {
      result.current.recordUse('a');
      result.current.recordUse('b');
    });
    expect(onFrequentlyUsedChange).toHaveBeenLastCalledWith(['b', 'a']);
  });
});
