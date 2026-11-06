import React from 'react';
import type { PropsWithChildren } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { SCHEDULED_MESSAGE_STATUS, ScheduledMessageEventType } from 'stream-chat';
import type { StreamChat } from 'stream-chat';

import { useScheduledMessageGroups } from '../useScheduledMessageGroups';
import { useScheduledMessagesPagination } from '../useScheduledMessagesPagination';
import { ChatProvider } from '../../../../context';
import {
  convertDateToTimestamp,
  dispatchScheduledMessageEvent,
  generateScheduledMessage,
  getTestClientWithUser,
  mockChatContext,
} from '../../../../mock-builders';

const cid = 'messaging:general';
const parentId = 'parent-1';

const createWrapper = (client: StreamChat) => {
  const ChatWrapper = ({ children }: PropsWithChildren) => (
    <ChatProvider value={mockChatContext({ client })}>{children}</ChatProvider>
  );

  return ChatWrapper;
};

const atLocalTime = (day: number, hour: number) =>
  convertDateToTimestamp(new Date(2026, 9, day, hour, 0));

describe('useScheduledMessageGroups', () => {
  it('groups the channel messages with failed ones first', async () => {
    const client = await getTestClientWithUser({ id: 'user-id' });
    const failed = generateScheduledMessage({
      cid,
      scheduled_at: atLocalTime(30, 9),
      status: SCHEDULED_MESSAGE_STATUS.Failed,
    });
    const upcoming = generateScheduledMessage({ cid, scheduled_at: atLocalTime(29, 9) });
    const threadReply = generateScheduledMessage({
      cid,
      message: { custom: {}, parent_id: parentId, text: 'reply' },
    });
    [failed, upcoming, threadReply].forEach(client.scheduledMessages.upsertToState);

    const { result } = renderHook(() => useScheduledMessageGroups({ cid }), {
      wrapper: createWrapper(client),
    });

    expect(
      result.current.groups.map(({ scheduledMessages }) => scheduledMessages),
    ).toEqual([[failed], [upcoming]]);
  });

  it('groups only the replies of a thread', async () => {
    const client = await getTestClientWithUser({ id: 'user-id' });
    const threadReply = generateScheduledMessage({
      cid,
      message: { custom: {}, parent_id: parentId, text: 'reply' },
    });
    [generateScheduledMessage({ cid }), threadReply].forEach(
      client.scheduledMessages.upsertToState,
    );

    const { result } = renderHook(() => useScheduledMessageGroups({ cid, parentId }), {
      wrapper: createWrapper(client),
    });

    expect(result.current.groups).toHaveLength(1);
    expect(result.current.groups[0].scheduledMessages).toEqual([threadReply]);
  });

  it('regroups when a scheduled message event arrives', async () => {
    const client = await getTestClientWithUser({ id: 'user-id' });
    client.scheduledMessages.registerSubscriptions();
    const scheduledMessage = generateScheduledMessage({ cid });

    const { result } = renderHook(() => useScheduledMessageGroups({ cid }), {
      wrapper: createWrapper(client),
    });

    expect(result.current.groups).toEqual([]);

    act(() =>
      dispatchScheduledMessageEvent({
        client,
        scheduledMessage,
        type: ScheduledMessageEventType.Created,
      }),
    );

    await waitFor(() => expect(result.current.groups).toHaveLength(1));

    client.scheduledMessages.unregisterSubscriptions();
  });

  it('keeps the same groups when another channel changes', async () => {
    const client = await getTestClientWithUser({ id: 'user-id' });
    client.scheduledMessages.upsertToState(generateScheduledMessage({ cid }));

    const { result } = renderHook(() => useScheduledMessageGroups({ cid }), {
      wrapper: createWrapper(client),
    });
    const initialGroups = result.current.groups;

    act(() =>
      client.scheduledMessages.upsertToState(
        generateScheduledMessage({ cid: 'messaging:random' }),
      ),
    );

    expect(result.current.groups).toBe(initialGroups);
  });
});

describe('useScheduledMessagesPagination', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('can load more only while the store has a next cursor', async () => {
    const client = await getTestClientWithUser({ id: 'user-id' });

    const { result } = renderHook(() => useScheduledMessagesPagination(), {
      wrapper: createWrapper(client),
    });

    expect(result.current.canLoadMore).toBe(false);

    act(() => client.scheduledMessages.state.partialNext({ next: 'cursor' }));

    expect(result.current.canLoadMore).toBe(true);
  });

  it('loads the next page through the manager', async () => {
    const client = await getTestClientWithUser({ id: 'user-id' });
    const loadMore = vi
      .spyOn(client.scheduledMessages, 'loadMore')
      .mockResolvedValue(undefined);

    const { result } = renderHook(() => useScheduledMessagesPagination(), {
      wrapper: createWrapper(client),
    });

    act(() => result.current.loadMore());

    expect(loadMore).toHaveBeenCalledTimes(1);
  });

  it('keeps a failed page load in the manager state instead of throwing', async () => {
    const client = await getTestClientWithUser({ id: 'user-id' });
    const error = new Error('Network Error');
    vi.spyOn(client, 'queryScheduledMessages').mockRejectedValue(error);
    client.scheduledMessages.state.partialNext({ next: 'cursor' });

    const { result } = renderHook(() => useScheduledMessagesPagination(), {
      wrapper: createWrapper(client),
    });

    act(() => result.current.loadMore());

    await waitFor(() =>
      expect(client.scheduledMessages.state.getLatestValue()).toEqual(
        expect.objectContaining({ isLoading: false, lastQueryError: error }),
      ),
    );
    expect(result.current).toEqual(
      expect.objectContaining({ canLoadMore: true, isLoading: false }),
    );
  });
});
