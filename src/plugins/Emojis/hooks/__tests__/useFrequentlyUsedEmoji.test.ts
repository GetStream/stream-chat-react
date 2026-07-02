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
});
