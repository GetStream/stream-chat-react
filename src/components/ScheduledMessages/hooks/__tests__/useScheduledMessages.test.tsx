import React from 'react';
import type { PropsWithChildren } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { StreamChat } from 'stream-chat';

import { useScheduledMessages } from '../useScheduledMessages';
import type { UseScheduledMessagesParams } from '../../types';
import { ChatProvider } from '../../../../context';
import {
  convertDateToTimestamp,
  generateScheduledMessage,
  getTestClientWithUser,
  hydrateScheduledMessages,
  mockChatContext,
} from '../../../../mock-builders';

const cid = 'messaging:general';
const otherCid = 'messaging:random';

const renderUseScheduledMessages = (
  client: StreamChat,
  params?: UseScheduledMessagesParams,
) => {
  const wrapper = ({ children }: PropsWithChildren) => (
    <ChatProvider value={mockChatContext({ client })}>{children}</ChatProvider>
  );
  const renders = { count: 0 };

  const hook = renderHook(
    () => {
      renders.count += 1;
      return useScheduledMessages(params);
    },
    { wrapper },
  );

  return { ...hook, renders };
};

describe('useScheduledMessages', () => {
  it('returns the channel-level scheduled messages ordered by scheduled_at', async () => {
    const client = await getTestClientWithUser({ id: 'user-id' });
    const later = generateScheduledMessage({
      cid,
      scheduled_at: convertDateToTimestamp('2030-01-02T00:00:00Z'),
    });
    const sooner = generateScheduledMessage({
      cid,
      scheduled_at: convertDateToTimestamp('2030-01-01T00:00:00Z'),
    });
    const reply = generateScheduledMessage({
      cid,
      message: { custom: {}, parent_id: 'parent-1', text: 'reply' },
    });
    const elsewhere = generateScheduledMessage({ cid: otherCid });
    hydrateScheduledMessages(client, cid, [later, reply, sooner]);
    hydrateScheduledMessages(client, otherCid, [elsewhere]);

    const { result } = renderUseScheduledMessages(client, { cid });

    expect(result.current.scheduledMessages).toEqual([sooner, later]);
  });

  it('returns the replies of a thread when parentId is given', async () => {
    const client = await getTestClientWithUser({ id: 'user-id' });
    const reply = generateScheduledMessage({
      cid,
      message: { custom: {}, parent_id: 'parent-1', text: 'reply' },
    });
    const channelLevel = generateScheduledMessage({ cid });
    hydrateScheduledMessages(client, cid, [reply, channelLevel]);

    const { result } = renderUseScheduledMessages(client, { cid, parentId: 'parent-1' });

    expect(result.current.scheduledMessages).toEqual([reply]);
  });

  it('returns every scheduled message ordered by scheduled_at without a scope', async () => {
    const client = await getTestClientWithUser({ id: 'user-id' });
    const later = generateScheduledMessage({
      cid,
      scheduled_at: convertDateToTimestamp('2030-01-02T00:00:00Z'),
    });
    const sooner = generateScheduledMessage({
      cid: otherCid,
      scheduled_at: convertDateToTimestamp('2030-01-01T00:00:00Z'),
    });
    vi.mocked(client.queryScheduledMessages).mockResolvedValue({
      duration: '',
      scheduled_messages: [later, sooner],
    });

    const { result } = renderUseScheduledMessages(client);

    await waitFor(() =>
      expect(result.current.scheduledMessages).toEqual([sooner, later]),
    );
    expect(client.queryScheduledMessages).toHaveBeenCalledTimes(1);
  });

  it('queries the first page of its channel when the channel was not hydrated', async () => {
    const client = await getTestClientWithUser({ id: 'user-id' });
    const scheduledMessage = generateScheduledMessage({ cid });
    vi.mocked(client.queryScheduledMessages).mockResolvedValue({
      duration: '',
      scheduled_messages: [scheduledMessage],
    });

    const { result } = renderUseScheduledMessages(client, { cid });

    await waitFor(() =>
      expect(result.current.scheduledMessages).toEqual([scheduledMessage]),
    );
    expect(client.queryScheduledMessages).toHaveBeenCalledWith(
      expect.objectContaining({ filter: expect.objectContaining({ cid }) }),
    );
  });

  it('does not query a channel hydrated by its channel query', async () => {
    const client = await getTestClientWithUser({ id: 'user-id' });
    hydrateScheduledMessages(client, cid);

    const { result } = renderUseScheduledMessages(client, { cid });

    expect(result.current).toEqual(
      expect.objectContaining({
        isLoaded: true,
        isLoading: false,
        scheduledMessages: [],
      }),
    );
    expect(client.queryScheduledMessages).not.toHaveBeenCalled();
  });

  it('exposes whether scheduled messages are disabled', async () => {
    const client = await getTestClientWithUser({ id: 'user-id' });
    const { result } = renderUseScheduledMessages(client, { cid });

    act(() => {
      client.scheduledMessages.state.partialNext({ isDisabled: true });
    });

    expect(result.current.isDisabled).toBe(true);
  });

  it('updates when a scheduled message of its scope changes', async () => {
    const client = await getTestClientWithUser({ id: 'user-id' });
    const scheduledMessage = generateScheduledMessage({ cid });
    const { result } = renderUseScheduledMessages(client, { cid });

    act(() => {
      client.scheduledMessages.upsertToState(scheduledMessage);
    });

    expect(result.current.scheduledMessages).toEqual([scheduledMessage]);
  });

  it('does not re-render when a scheduled message outside its scope changes', async () => {
    const client = await getTestClientWithUser({ id: 'user-id' });
    hydrateScheduledMessages(client, cid, [generateScheduledMessage({ cid })]);
    const { renders, result } = renderUseScheduledMessages(client, { cid });
    const rendersBefore = renders.count;
    const listBefore = result.current.scheduledMessages;

    act(() => {
      client.scheduledMessages.upsertToState(generateScheduledMessage({ cid: otherCid }));
    });

    expect(renders.count).toBe(rendersBefore);
    expect(result.current.scheduledMessages).toBe(listBefore);
  });
});
