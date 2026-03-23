import { act, renderHook } from '@testing-library/react';
import { useDebouncedTypingActive } from '../useDebouncedTypingActive';

vi.useFakeTimers({ shouldAdvanceTime: true });

const entry = (id, name = `User ${id}`) => ({
  user: { id, image: undefined, name },
});

describe('useDebouncedTypingActive', () => {
  it('returns empty displayUsers when typingUsers is empty initially', () => {
    const { result } = renderHook(() => useDebouncedTypingActive([]));
    expect(result.current.displayUsers).toEqual([]);
  });

  it('returns displayUsers when typingUsers is non-empty', () => {
    const users = [entry('1'), entry('2')];
    const { result } = renderHook(() => useDebouncedTypingActive(users));
    expect(result.current.displayUsers).toHaveLength(2);
    expect(result.current.displayUsers[0].user?.id).toBe('1');
  });

  it('keeps last displayUsers for delayMs after typingUsers becomes empty', () => {
    const users = [entry('1')];
    const { rerender, result } = renderHook(
      ({ typingUsers }) => useDebouncedTypingActive(typingUsers, 2000),
      { initialProps: { typingUsers: users } },
    );
    expect(result.current.displayUsers).toHaveLength(1);

    rerender({ typingUsers: [] });
    expect(result.current.displayUsers).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(1999);
    });
    expect(result.current.displayUsers).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.displayUsers).toEqual([]);
  });

  it('clears hide timer when typingUsers becomes non-empty again before delay', () => {
    const { rerender, result } = renderHook(
      ({ typingUsers }) => useDebouncedTypingActive(typingUsers, 2000),
      { initialProps: { typingUsers: [entry('1')] } },
    );
    rerender({ typingUsers: [] });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    rerender({ typingUsers: [entry('1'), entry('2')] });
    expect(result.current.displayUsers).toHaveLength(2);
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.displayUsers).toHaveLength(2);
  });
});
