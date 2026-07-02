import { act, renderHook } from '@testing-library/react';
import { useSkinTone } from '../useSkinTone';

describe('useSkinTone', () => {
  it('is uncontrolled from defaultSkinTone and updates internally', () => {
    const { result } = renderHook(() => useSkinTone({ defaultSkinTone: 2 }));
    expect(result.current[0]).toBe(2);
    act(() => result.current[1](4));
    expect(result.current[0]).toBe(4);
  });

  it('clamps out-of-range values to 0..5', () => {
    const { result } = renderHook(() => useSkinTone({ defaultSkinTone: 99 }));
    expect(result.current[0]).toBe(5);
    act(() => result.current[1](-3));
    expect(result.current[0]).toBe(0);
  });

  it('is controlled when skinTone is provided and does not self-update', () => {
    const onSkinToneChange = vi.fn();
    const { rerender, result } = renderHook(
      ({ skinTone }) => useSkinTone({ onSkinToneChange, skinTone }),
      { initialProps: { skinTone: 1 } },
    );
    expect(result.current[0]).toBe(1);
    act(() => result.current[1](3));
    expect(onSkinToneChange).toHaveBeenCalledWith(3);
    expect(result.current[0]).toBe(1); // stays until the controlled prop changes
    rerender({ skinTone: 3 });
    expect(result.current[0]).toBe(3);
  });
});
