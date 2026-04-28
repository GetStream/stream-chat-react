import { act, renderHook } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';

import { useIncomingMessageAnnouncements } from '../useIncomingMessageAnnouncements';

import type { Channel, Event, LocalMessage } from 'stream-chat';

const { announceMock, tMock } = vi.hoisted(() => ({
  announceMock: vi.fn(),
  tMock: vi.fn((key: string, options?: { count?: number; user?: string }) => {
    if (key === '{{count}} new messages') {
      return `${options?.count} new messages`;
    }

    if (key === 'New message from {{user}}') {
      return `New message from ${options?.user}`;
    }

    return key;
  }),
}));

vi.mock('../../useAriaLiveAnnouncer', () => ({
  useAriaLiveAnnouncer: () => announceMock,
}));

vi.mock('../../../../context/TranslationContext', () => ({
  useTranslationContext: () => ({ t: tMock }),
}));

const createMessage = ({
  id,
  parentId,
  userId,
  userName,
}: {
  id: string;
  parentId?: string;
  userId: string;
  userName?: string;
}) =>
  fromPartial<LocalMessage>({
    created_at: new Date('2026-04-22T10:00:00.000Z'),
    id,
    parent_id: parentId,
    status: 'received',
    type: 'regular',
    user: { id: userId, name: userName },
  });

const createChannelMock = () => {
  const handlers = new Set<(event: Event) => void>();
  const channel = fromPartial<Channel>({
    cid: 'messaging:test-channel',
    on: vi.fn((eventType: string, handler: (event: Event) => void) => {
      if (eventType === 'message.new') {
        handlers.add(handler);
      }

      return {
        unsubscribe: () => handlers.delete(handler),
      };
    }),
  });

  const emitMessageNew = (message: LocalMessage, cid?: string) => {
    const event = fromPartial<Event>({
      message,
      type: 'message.new',
      user: message.user,
      ...(typeof cid !== 'undefined' ? { cid } : {}),
    });

    handlers.forEach((handler) => handler(event));
  };

  return { channel, emitMessageNew };
};

describe('useIncomingMessageAnnouncements', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('announces incoming message.new events for channel list', () => {
    const { channel, emitMessageNew } = createChannelMock();

    renderHook(() =>
      useIncomingMessageAnnouncements({
        channel,
        ownUserId: 'me',
      }),
    );

    emitMessageNew(
      createMessage({ id: 'm-1', userId: 'alice', userName: 'Alice' }),
      'messaging:test-channel',
    );

    expect(announceMock).toHaveBeenCalledTimes(1);
    expect(announceMock).toHaveBeenCalledWith('New message from Alice');
  });

  it('announces incoming message.new events even when cid is absent', () => {
    const { channel, emitMessageNew } = createChannelMock();

    renderHook(() =>
      useIncomingMessageAnnouncements({
        channel,
        ownUserId: 'me',
      }),
    );

    emitMessageNew(
      createMessage({
        id: 'm-no-cid',
        userId: 'alice',
        userName: 'Alice',
      }),
      undefined,
    );

    expect(announceMock).toHaveBeenCalledTimes(1);
    expect(announceMock).toHaveBeenCalledWith('New message from Alice');
  });

  it("doesn't announce own incoming events", () => {
    const { channel, emitMessageNew } = createChannelMock();

    renderHook(() =>
      useIncomingMessageAnnouncements({
        channel,
        ownUserId: 'me',
      }),
    );

    emitMessageNew(
      createMessage({ id: 'm-1', userId: 'me', userName: 'Me' }),
      'messaging:test-channel',
    );

    expect(announceMock).not.toHaveBeenCalled();
  });

  it('throttles and batches multiple message.new events within one second', () => {
    const { channel, emitMessageNew } = createChannelMock();

    renderHook(() =>
      useIncomingMessageAnnouncements({
        channel,
        ownUserId: 'me',
      }),
    );

    emitMessageNew(
      createMessage({ id: 'm-1', userId: 'alice', userName: 'Alice' }),
      'messaging:test-channel',
    );
    expect(announceMock).toHaveBeenCalledTimes(1);
    expect(announceMock).toHaveBeenLastCalledWith('New message from Alice');

    emitMessageNew(
      createMessage({ id: 'm-2', userId: 'bob', userName: 'Bob' }),
      'messaging:test-channel',
    );
    emitMessageNew(
      createMessage({ id: 'm-3', userId: 'charlie', userName: 'Charlie' }),
      'messaging:test-channel',
    );
    expect(announceMock).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(999);
    });
    expect(announceMock).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(announceMock).toHaveBeenCalledTimes(2);
    expect(announceMock).toHaveBeenLastCalledWith('2 new messages');
  });

  it('avoids duplicate announcements with simultaneous channel and thread message lists', () => {
    const { channel, emitMessageNew } = createChannelMock();
    const threadId = 'thread-1';

    renderHook(() =>
      useIncomingMessageAnnouncements({
        activeThreadId: threadId,
        channel,
        ownUserId: 'me',
      }),
    );

    renderHook(() =>
      useIncomingMessageAnnouncements({
        activeThreadId: threadId,
        channel,
        ownUserId: 'me',
        threadList: true,
      }),
    );

    emitMessageNew(
      createMessage({
        id: 'thread-reply',
        parentId: threadId,
        userId: 'alice',
        userName: 'Alice',
      }),
      'messaging:test-channel',
    );
    expect(announceMock).toHaveBeenCalledTimes(1);
    expect(announceMock).toHaveBeenLastCalledWith('New message from Alice');

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    emitMessageNew(
      createMessage({
        id: 'channel-message',
        userId: 'bob',
        userName: 'Bob',
      }),
      'messaging:test-channel',
    );
    expect(announceMock).toHaveBeenCalledTimes(2);
    expect(announceMock).toHaveBeenLastCalledWith('New message from Bob');
  });
});
