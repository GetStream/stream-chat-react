import { act, renderHook } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import { StateStore } from 'stream-chat';
import type { Channel, LocalMessage, PaginatorState } from 'stream-chat';

import { usePinnedMessagesCount } from '../usePinnedMessagesCount';

const makePinnedMessage = (id: string) => fromPartial<LocalMessage>({ id, pinned: true });

const createChannel = (pinnedMessages: LocalMessage[] = []) => {
  const state = new StateStore<PaginatorState<LocalMessage>>({
    hasMoreHead: true,
    hasMoreTail: true,
    isLoading: false,
    items: pinnedMessages,
  });

  const channel = fromPartial<Channel>({
    pinnedMessagesPaginator: { state },
  });

  const setItems = (items: LocalMessage[]) =>
    act(() => {
      state.partialNext({ items });
    });

  return { channel, setItems };
};

describe('usePinnedMessagesCount', () => {
  it('returns the initial pinned-message count from the paginator', () => {
    const { channel } = createChannel([
      makePinnedMessage('message-1'),
      makePinnedMessage('message-2'),
    ]);

    const { result } = renderHook(() => usePinnedMessagesCount(channel));

    expect(result.current).toBe(2);
  });

  it('returns 0 when the channel has no pinned messages', () => {
    const { channel } = createChannel();

    const { result } = renderHook(() => usePinnedMessagesCount(channel));

    expect(result.current).toBe(0);
  });

  it('re-renders with the new count when the paginator items change', () => {
    const { channel, setItems } = createChannel([makePinnedMessage('message-1')]);

    const { result } = renderHook(() => usePinnedMessagesCount(channel));
    expect(result.current).toBe(1);

    // Another message is pinned (not a 0 <-> 1 change).
    setItems([makePinnedMessage('message-1'), makePinnedMessage('message-2')]);
    expect(result.current).toBe(2);

    // A pinned message is removed.
    setItems([makePinnedMessage('message-2')]);
    expect(result.current).toBe(1);
  });
});
