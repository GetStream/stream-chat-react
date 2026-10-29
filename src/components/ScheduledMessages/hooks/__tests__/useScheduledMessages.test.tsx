import React from 'react';
import type { PropsWithChildren } from 'react';
import { act, renderHook } from '@testing-library/react';
import type { StreamChat } from 'stream-chat';

import { useScheduledMessages } from '../useScheduledMessages';
import type { UseScheduledMessagesParams } from '../../types';
import { ChatProvider } from '../../../../context';
import {
  generateScheduledMessage,
  getTestClientWithUser,
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
    const later = generateScheduledMessage({ cid, scheduled_at: '2030-01-02T00:00:00Z' });
    const sooner = generateScheduledMessage({
      cid,
      scheduled_at: '2030-01-01T00:00:00Z',
    });
    const reply = generateScheduledMessage({
      cid,
      message: { parent_id: 'parent-1', text: 'reply' },
    });
    const elsewhere = generateScheduledMessage({ cid: otherCid });
    [later, reply, elsewhere, sooner].forEach(client.scheduledMessages.upsertToState);

    const { result } = renderUseScheduledMessages(client, { cid });

    expect(result.current.scheduledMessages).toEqual([sooner, later]);
  });

  it('returns the replies of a thread when parentId is given', async () => {
    const client = await getTestClientWithUser({ id: 'user-id' });
    const reply = generateScheduledMessage({
      cid,
      message: { parent_id: 'parent-1', text: 'reply' },
    });
    const channelLevel = generateScheduledMessage({ cid });
    [reply, channelLevel].forEach(client.scheduledMessages.upsertToState);

    const { result } = renderUseScheduledMessages(client, { cid, parentId: 'parent-1' });

    expect(result.current.scheduledMessages).toEqual([reply]);
  });

  it('returns every scheduled message ordered by scheduled_at without a scope', async () => {
    const client = await getTestClientWithUser({ id: 'user-id' });
    const later = generateScheduledMessage({ cid, scheduled_at: '2030-01-02T00:00:00Z' });
    const sooner = generateScheduledMessage({
      cid: otherCid,
      scheduled_at: '2030-01-01T00:00:00Z',
    });
    [later, sooner].forEach(client.scheduledMessages.upsertToState);

    const { result } = renderUseScheduledMessages(client);

    expect(result.current.scheduledMessages).toEqual([sooner, later]);
  });

  it('exposes the loading flags of the store', async () => {
    const client = await getTestClientWithUser({ id: 'user-id' });
    const { result } = renderUseScheduledMessages(client, { cid });

    act(() => {
      client.scheduledMessages.state.partialNext({
        isDisabled: true,
        isLoaded: true,
        isLoading: false,
      });
    });

    expect(result.current).toEqual(
      expect.objectContaining({ isDisabled: true, isLoaded: true, isLoading: false }),
    );
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
    client.scheduledMessages.upsertToState(generateScheduledMessage({ cid }));
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
