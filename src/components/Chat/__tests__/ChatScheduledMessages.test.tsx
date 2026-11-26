import React, { StrictMode } from 'react';
import { act, cleanup, render, waitFor } from '@testing-library/react';
import { ScheduledMessagePaginator } from 'stream-chat';
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

/** A list registered with the client, the only kind the scheduled message events reach. */
const registerScheduledMessageList = (client: StreamChat) => {
  const paginator = new ScheduledMessagePaginator({ client });
  client.scheduledMessagePaginators.insertPaginator({ paginator });
  return paginator;
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

    expect(client.scheduledMessagePaginators.hasSubscriptions).toBe(true);
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
    const ingest = vi.spyOn(client.scheduledMessagePaginators, 'ingest');

    await renderChat(client, { strict: true });
    act(() => {
      dispatchScheduledMessageEvent({
        client,
        scheduledMessage,
        type: 'scheduled_message.created',
      });
    });

    await waitFor(() => expect(ingest).toHaveBeenCalledTimes(1));
  });

  it('keeps the store in sync from events while mounted', async () => {
    const client = await getTestClientWithUser({ id: 'user-1' });
    const scheduledMessage = generateScheduledMessage();
    const list = registerScheduledMessageList(client);
    await renderChat(client);

    act(() => {
      dispatchScheduledMessageEvent({
        client,
        scheduledMessage,
        type: 'scheduled_message.created',
      });
    });

    await waitFor(() => expect(list.items).toEqual([scheduledMessage]));
  });

  // the banner turns into the failure; the send happens later, apart from any user action
  it('does not notify about a scheduled message that failed to send', async () => {
    const client = await getTestClientWithUser({ id: 'user-1' });
    await renderChat(client);

    act(() => {
      dispatchScheduledMessageEvent({
        client,
        scheduledMessage: generateScheduledMessage({
          failure_reason: 'channel_frozen',
          status: 'failed',
        }),
        type: 'scheduled_message.failed',
      });
    });

    expect(client.notifications.store.getLatestValue().notifications).toEqual([]);
  });

  it('unsubscribes on unmount', async () => {
    const client = await getTestClientWithUser({ id: 'user-1' });
    const scheduledMessage = generateScheduledMessage();
    const list = registerScheduledMessageList(client);
    const { unmount } = await renderChat(client);

    unmount();
    act(() => {
      dispatchScheduledMessageEvent({
        client,
        scheduledMessage,
        type: 'scheduled_message.created',
      });
    });
    await client.scheduledMessagePaginators.pipelines
      .get('scheduled_message.created')
      ?.drain();

    expect(client.scheduledMessagePaginators.hasSubscriptions).toBe(false);
    expect(list.items).toBeUndefined();
  });
});
