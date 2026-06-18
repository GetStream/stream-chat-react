import { act, renderHook } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import type { Channel, LocalMessage } from 'stream-chat';

import { usePinnedMessagesCount } from '../usePinnedMessagesCount';

type EventHandler = () => void;

const makePinnedMessage = (id: string) => fromPartial<LocalMessage>({ id, pinned: true });

const createChannel = (pinnedMessages: LocalMessage[] = []) => {
  const handlers: Record<string, EventHandler[]> = {};
  const state = { pinnedMessages };
  const unsubscribe = vi.fn();

  const channel = fromPartial<Channel>({
    on: vi.fn((event: string, handler: EventHandler) => {
      handlers[event] = handlers[event] ?? [];
      handlers[event].push(handler);
      return { unsubscribe };
    }),
    state,
  });

  const emit = (event: string) => {
    act(() => {
      handlers[event]?.forEach((handler) => handler());
    });
  };

  return { channel, emit, state, unsubscribe };
};

describe('usePinnedMessagesCount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the initial pinned-message count from channel state', () => {
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

  it.each(['message.new', 'message.updated', 'message.deleted', 'message.undeleted'])(
    're-reads the count from channel state on %s',
    (event) => {
      const { channel, emit, state } = createChannel([makePinnedMessage('message-1')]);

      const { result } = renderHook(() => usePinnedMessagesCount(channel));
      expect(result.current).toBe(1);

      // Another message is pinned (not a 0 <-> 1 change).
      state.pinnedMessages = [
        makePinnedMessage('message-1'),
        makePinnedMessage('message-2'),
      ];
      emit(event);
      expect(result.current).toBe(2);

      // A pinned message is removed.
      state.pinnedMessages = [makePinnedMessage('message-2')];
      emit(event);
      expect(result.current).toBe(1);
    },
  );

  it('unsubscribes from channel events on unmount', () => {
    const { channel, unsubscribe } = createChannel();

    const { unmount } = renderHook(() => usePinnedMessagesCount(channel));
    unmount();

    // one subscription per listened event
    expect(unsubscribe).toHaveBeenCalledTimes(4);
  });
});
