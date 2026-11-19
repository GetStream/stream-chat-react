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

  it('keeps the key when the last message is removed', () => {
    const { rerender, result } = setup(set('a', 'b', 'c'));
    const mounted = result.current;
    rerender({ messages: set('a', 'b') });
    expect(result.current).toBe(mounted);
  });

  it('renews the key when a page overlapping the previous one replaces it from above', () => {
    // A jump to a message just above the loaded page: older messages before the previous first
    // one, the previous newest ones gone.
    const { rerender, result } = setup(set('c', 'd', 'e', 'f'));
    const before = result.current;
    rerender({ messages: set('a', 'b', 'c', 'd') });
    expect(result.current).not.toBe(before);
  });

  describe('jumps', () => {
    const setupWithSignal = (initial: LocalMessage[]) =>
      renderHook(
        ({ focusSignal, messages }) =>
          useMessageSetKey({ focusSignal, messages }).messageSetKey,
        {
          initialProps: {
            focusSignal: null as { messageId: string } | null,
            messages: initial,
          },
        },
      );

    it('renews the key for a jump to a message that arrived with the change', () => {
      // The page around the target overlaps the loaded one, so it looks like a prepend.
      const { rerender, result } = setupWithSignal(set('c', 'd', 'e'));
      const before = result.current;
      rerender({
        focusSignal: { messageId: 'b' },
        messages: set('a', 'b', 'c', 'd', 'e'),
      });
      expect(result.current).not.toBe(before);
    });

    it('renews the key when the signal renders after the messages', () => {
      const { rerender, result } = setupWithSignal(set('c', 'd', 'e'));
      const before = result.current;
      const merged = set('a', 'b', 'c', 'd', 'e');
      rerender({ focusSignal: null, messages: merged });
      expect(result.current).toBe(before);
      rerender({ focusSignal: { messageId: 'b' }, messages: merged });
      expect(result.current).not.toBe(before);
    });

    it('keeps the key for a jump to a message already shown, and renews it once per jump', () => {
      const { rerender, result } = setupWithSignal(set('a', 'b', 'c'));
      const before = result.current;
      const signal = { messageId: 'b' };
      rerender({ focusSignal: signal, messages: set('a', 'b', 'c') });
      expect(result.current).toBe(before);
      rerender({ focusSignal: signal, messages: set('a', 'b', 'c', 'd') });
      expect(result.current).toBe(before);
    });
  });

  describe('jumps to messages loaded before', () => {
    const setupWithSignal = (initial: LocalMessage[]) =>
      renderHook(
        ({ focusSignal, messages }) =>
          useMessageSetKey({ focusSignal, messages }).messageSetKey,
        {
          initialProps: {
            focusSignal: null as { messageId: string } | null,
            messages: initial,
          },
        },
      );

    it('keeps the key for a later jump to a message that arrived live', () => {
      const { rerender, result } = setupWithSignal(set('a', 'b'));
      const before = result.current;
      const withLive = set('a', 'b', 'live');
      rerender({ focusSignal: null, messages: withLive });
      // The reader later finds it through search and jumps to it.
      rerender({ focusSignal: { messageId: 'live' }, messages: withLive });
      expect(result.current).toBe(before);
    });

    it('keeps the key for a jump to a message an older page brought several changes ago', () => {
      const { rerender, result } = setupWithSignal(set('c', 'd'));
      const before = result.current;
      rerender({ focusSignal: null, messages: set('a', 'b', 'c', 'd') });
      rerender({ focusSignal: null, messages: set('a', 'b', 'c', 'd', 'e') });
      rerender({
        focusSignal: { messageId: 'b' },
        messages: set('a', 'b', 'c', 'd', 'e'),
      });
      expect(result.current).toBe(before);
    });
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
