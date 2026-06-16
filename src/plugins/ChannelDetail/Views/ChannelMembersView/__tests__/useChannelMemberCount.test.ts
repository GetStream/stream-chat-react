import { act, renderHook } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import type { Channel } from 'stream-chat';

import { useChannelMemberCount } from '../useChannelMemberCount';

type EventHandler = () => void;

const createChannel = (memberCount: number) => {
  const handlers: Record<string, EventHandler[]> = {};
  const data = { member_count: memberCount };
  const unsubscribe = vi.fn();

  const channel = fromPartial<Channel>({
    data,
    on: vi.fn((event: string, handler: EventHandler) => {
      handlers[event] = handlers[event] ?? [];
      handlers[event].push(handler);
      return { unsubscribe };
    }),
  });

  const emit = (event: string) => {
    act(() => {
      handlers[event]?.forEach((handler) => handler());
    });
  };

  return { channel, data, emit, unsubscribe };
};

describe('useChannelMemberCount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the initial member count from channel data', () => {
    const { channel } = createChannel(5);

    const { result } = renderHook(() => useChannelMemberCount(channel));

    expect(result.current).toBe(5);
  });

  it('re-reads the member count from channel state on membership events', () => {
    const { channel, data, emit } = createChannel(5);

    const { result } = renderHook(() => useChannelMemberCount(channel));

    data.member_count = 3;
    emit('member.removed');
    expect(result.current).toBe(3);

    data.member_count = 4;
    emit('member.added');
    expect(result.current).toBe(4);

    data.member_count = 10;
    emit('channel.updated');
    expect(result.current).toBe(10);
  });

  it('unsubscribes from channel events on unmount', () => {
    const { channel, unsubscribe } = createChannel(2);

    const { unmount } = renderHook(() => useChannelMemberCount(channel));
    unmount();

    // one subscription per listened event
    expect(unsubscribe).toHaveBeenCalledTimes(3);
  });
});
