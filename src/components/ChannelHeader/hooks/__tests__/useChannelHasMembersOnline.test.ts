import { act, renderHook } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import type { Channel } from 'stream-chat';

import { useChannelStateContext } from '../../../../context/ChannelStateContext';
import { useChatContext } from '../../../../context/ChatContext';
import { useChannelHasMembersOnline } from '../useChannelHasMembersOnline';

vi.mock('../../../../context/ChannelStateContext');
vi.mock('../../../../context/ChatContext');

type WatchingEvent = { user?: { id?: string } };
type EventHandler = (event: WatchingEvent) => void;

const createChannel = (watchers: Record<string, { id: string }> = {}) => {
  const handlers: Record<string, EventHandler[]> = {};

  const channel = fromPartial<Channel>({
    on: vi.fn((event: string, handler: EventHandler) => {
      (handlers[event] = handlers[event] ?? []).push(handler);
      return { unsubscribe: vi.fn() };
    }),
    state: { watchers },
  });

  const emit = (event: string, payload: WatchingEvent) =>
    act(() => handlers[event]?.forEach((handler) => handler(payload)));

  return { channel, emit };
};

const renderForChannel = (channel: Channel) => {
  vi.mocked(useChannelStateContext).mockReturnValue({
    channel,
  } as ReturnType<typeof useChannelStateContext>);

  return renderHook(() => useChannelHasMembersOnline());
};

describe('useChannelHasMembersOnline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useChatContext).mockReturnValue({
      client: { user: { id: 'me' } },
    } as ReturnType<typeof useChatContext>);
  });

  it('does not count the current user already in the watcher set', () => {
    const { channel } = createChannel({ me: { id: 'me' } });

    const { result } = renderForChannel(channel);

    expect(result.current).toBe(false);
  });

  it('returns true when another user is watching', () => {
    const { channel } = createChannel({ me: { id: 'me' }, other: { id: 'other' } });

    const { result } = renderForChannel(channel);

    expect(result.current).toBe(true);
  });

  it('ignores the current user starting to watch', () => {
    const { channel, emit } = createChannel();

    const { result } = renderForChannel(channel);
    expect(result.current).toBe(false);

    emit('user.watching.start', { user: { id: 'me' } });

    expect(result.current).toBe(false);
  });

  it('counts another user starting to watch and stops on watching.stop', () => {
    const { channel, emit } = createChannel();

    const { result } = renderForChannel(channel);
    expect(result.current).toBe(false);

    emit('user.watching.start', { user: { id: 'other' } });
    expect(result.current).toBe(true);

    emit('user.watching.stop', { user: { id: 'other' } });
    expect(result.current).toBe(false);
  });
});
