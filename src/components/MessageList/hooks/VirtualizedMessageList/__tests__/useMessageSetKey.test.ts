import { renderHook } from '@testing-library/react';
import type { LocalMessage } from 'stream-chat';

import { useMessageSetKey } from '../useMessageSetKey';

const set = (...ids: string[]) => ids.map((id) => ({ id }) as LocalMessage);

const setup = (initial: LocalMessage[]) =>
  renderHook(({ messages }) => useMessageSetKey({ messages }).messageSetKey, {
    initialProps: { messages: initial },
  });

describe('useMessageSetKey', () => {
  it('keeps the key the list mounted with', () => {
    const { rerender, result } = setup(set('a', 'b'));
    const mounted = result.current;
    rerender({ messages: set('a', 'b') });
    expect(result.current).toBe(mounted);
  });

  it('keeps the key when messages are appended or prepended', () => {
    const { rerender, result } = setup(set('b', 'c'));
    const mounted = result.current;
    rerender({ messages: set('b', 'c', 'd') });
    rerender({ messages: set('a', 'b', 'c', 'd') });
    expect(result.current).toBe(mounted);
  });

  it('renews the key when the first messages arrive in an empty list', () => {
    const { rerender, result } = setup([]);
    const empty = result.current;
    rerender({ messages: set('a') });
    expect(result.current).not.toBe(empty);
  });

  it('renews the key when the list jumps to a set without the previous first message', () => {
    const { rerender, result } = setup(set('a', 'b'));
    const before = result.current;
    rerender({ messages: set('x', 'y') });
    const afterFirstJump = result.current;
    expect(afterFirstJump).not.toBe(before);
    // A second jump in the same millisecond still renews the key.
    rerender({ messages: set('p', 'q') });
    expect(result.current).not.toBe(afterFirstJump);
  });
});
