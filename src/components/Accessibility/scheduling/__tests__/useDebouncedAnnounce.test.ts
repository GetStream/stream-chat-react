import { act, renderHook } from '@testing-library/react';

import { useDebouncedAnnounce } from '../useDebouncedAnnounce';

describe('useDebouncedAnnounce', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('announces only the last call within the delay window', () => {
    const announce = vi.fn();
    const { result } = renderHook(() => useDebouncedAnnounce(announce, 300));

    act(() => {
      result.current.announce('one', 'polite');
      result.current.announce('two', 'polite');
      result.current.announce('three', 'assertive');
    });
    expect(announce).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(300));

    expect(announce).toHaveBeenCalledTimes(1);
    expect(announce).toHaveBeenCalledWith('three', 'assertive');
  });

  it('cancel() prevents a pending announcement', () => {
    const announce = vi.fn();
    const { result } = renderHook(() => useDebouncedAnnounce(announce, 300));

    act(() => {
      result.current.announce('pending');
      result.current.cancel();
      vi.advanceTimersByTime(300);
    });

    expect(announce).not.toHaveBeenCalled();
  });

  it('uses the latest announce without resetting the timer', () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender, result } = renderHook(
      ({ announce }) => useDebouncedAnnounce(announce, 300),
      { initialProps: { announce: first } },
    );

    act(() => result.current.announce('msg'));
    rerender({ announce: second });
    act(() => vi.advanceTimersByTime(300));

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith('msg', undefined);
  });

  it('clears the pending timer on unmount', () => {
    const announce = vi.fn();
    const { result, unmount } = renderHook(() => useDebouncedAnnounce(announce, 300));

    act(() => result.current.announce('msg'));
    unmount();
    act(() => vi.advanceTimersByTime(300));

    expect(announce).not.toHaveBeenCalled();
  });
});
