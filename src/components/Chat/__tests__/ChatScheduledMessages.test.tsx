import React, { StrictMode } from 'react';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import type { StreamChat } from 'stream-chat';

import { Chat } from '..';
import {
  dispatchScheduledMessageEvent,
  generateScheduledMessage,
  getTestClientWithUser,
  setWSConnectionStatus,
} from '../../../mock-builders';

const renderChat = async (client: StreamChat, { strict = false } = {}) => {
  const chat = <Chat client={client}>{null}</Chat>;

  let result!: ReturnType<typeof render>;
  await act(() => {
    result = render(strict ? <StrictMode>{chat}</StrictMode> : chat);
  });
  return result;
};

const reconnect = async (client: StreamChat) => {
  await act(() => {
    setWSConnectionStatus(client, false);
    setWSConnectionStatus(client, true);
  });
};

describe('Chat scheduled messages wiring', () => {
  afterEach(() => {
    cleanup();
  });

  it('registers the scheduled message subscriptions while mounted', async () => {
    const client = await getTestClientWithUser({ id: 'user-1' });

    await renderChat(client);

    expect(client.scheduledMessages.hasSubscriptions).toBe(true);
  });

  it('does not query the scheduled messages on its own', async () => {
    const client = await getTestClientWithUser({ id: 'user-1' });

    await renderChat(client);
    await reconnect(client);

    expect(client.queryScheduledMessages).not.toHaveBeenCalled();
  });

  it('subscribes once under StrictMode', async () => {
    const client = await getTestClientWithUser({ id: 'user-1' });
    const scheduledMessage = generateScheduledMessage();
    const upsertToState = vi.spyOn(client.scheduledMessages, 'upsertToState');

    await renderChat(client, { strict: true });
    act(() => {
      dispatchScheduledMessageEvent({
        client,
        scheduledMessage,
        type: 'scheduled_message.created',
      });
    });

    await waitFor(() => expect(upsertToState).toHaveBeenCalledTimes(1));
  });

  it('keeps the store in sync from events while mounted', async () => {
    const client = await getTestClientWithUser({ id: 'user-1' });
    const scheduledMessage = generateScheduledMessage();
    await renderChat(client);

    act(() => {
      dispatchScheduledMessageEvent({
        client,
        scheduledMessage,
        type: 'scheduled_message.created',
      });
    });

    await waitFor(() =>
      expect(client.scheduledMessages.getFromState(scheduledMessage.id)).toEqual(
        scheduledMessage,
      ),
    );
  });

  it('reports a scheduled message that failed to send', async () => {
    const client = await getTestClientWithUser({ id: 'user-1' });
    const scheduledMessage = generateScheduledMessage({
      failure_reason: 'channel_frozen',
      status: 'failed',
    });
    await renderChat(client);

    act(() => {
      dispatchScheduledMessageEvent({
        client,
        scheduledMessage,
        type: 'scheduled_message.failed',
      });
    });

    expect(client.notifications.store.getLatestValue().notifications).toEqual([
      expect.objectContaining({
        metadata: { reason: 'channel_frozen', scheduledMessageId: scheduledMessage.id },
        severity: 'error',
        type: 'api:scheduled-message:send:failed',
      }),
    ]);
  });

  it('stops reporting failures after unmount', async () => {
    const client = await getTestClientWithUser({ id: 'user-1' });
    const { unmount } = await renderChat(client);

    unmount();
    act(() => {
      dispatchScheduledMessageEvent({
        client,
        scheduledMessage: generateScheduledMessage({ status: 'failed' }),
        type: 'scheduled_message.failed',
      });
    });

    expect(client.notifications.store.getLatestValue().notifications).toEqual([]);
  });

  it('unsubscribes on unmount', async () => {
    const client = await getTestClientWithUser({ id: 'user-1' });
    const scheduledMessage = generateScheduledMessage();
    const { unmount } = await renderChat(client);

    unmount();
    act(() => {
      dispatchScheduledMessageEvent({
        client,
        scheduledMessage,
        type: 'scheduled_message.created',
      });
    });
    await client.scheduledMessages.pipelines.get('scheduled_message.created')?.drain();

    expect(client.scheduledMessages.hasSubscriptions).toBe(false);
    expect(client.scheduledMessages.getFromState(scheduledMessage.id)).toBeUndefined();
  });
});
