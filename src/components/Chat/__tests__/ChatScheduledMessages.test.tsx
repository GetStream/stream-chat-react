import React, { StrictMode } from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import { chatLoggerSystem, StreamAPIError } from 'stream-chat';
import type { EventType, Sink, StreamChat } from 'stream-chat';

import { Chat } from '..';
import {
  dispatchScheduledMessageEvent,
  generateScheduledMessage,
  getTestClient,
  getTestClientWithUser,
  setWSConnectionStatus,
} from '../../../mock-builders';

const LOAD_FAILED_MESSAGE = 'Loading the scheduled messages failed.';

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

const countListeners = (client: StreamChat, type: EventType) =>
  client.listeners.get(type)?.size ?? 0;

const captureManagerLogs = () => {
  const sink = vi.fn<Sink>();
  chatLoggerSystem.configureLoggers({
    'scheduled-message-manager': { level: 'warn', sink },
  });
  return sink;
};

const featureDisabledError = () =>
  new StreamAPIError('failed', {
    code: 114,
    response: fromPartial<NonNullable<StreamAPIError['response']>>({
      data: {
        code: 114,
        exception_fields: { reason: 'scheduled_messages_disabled' },
        message: 'failed',
      },
      status: 400,
    }),
    status: 400,
  });

describe('Chat scheduled messages wiring', () => {
  afterEach(() => {
    cleanup();
    chatLoggerSystem.restoreDefaults();
  });

  it('loads the scheduled messages once the user is connected', async () => {
    const client = await getTestClientWithUser({ id: 'user-1' });

    await renderChat(client);

    expect(client.queryScheduledMessages).toHaveBeenCalledTimes(1);
    expect(client.queryScheduledMessages).toHaveBeenCalledWith({ limit: 100 });
    expect(client.scheduledMessages.state.getLatestValue().isLoaded).toBe(true);
  });

  it('does not load before a user is connected', async () => {
    const client = getTestClient();

    await renderChat(client);

    expect(client.queryScheduledMessages).not.toHaveBeenCalled();
  });

  it('loads when a user connects after the first render, without a re-render', async () => {
    const client = getTestClient();
    await renderChat(client);

    await client.connectUser({ id: 'user-1' }, 'token');
    await reconnect(client);

    expect(client.queryScheduledMessages).toHaveBeenCalledTimes(1);
  });

  it('does not load while the connection is offline', async () => {
    const client = await getTestClientWithUser({ id: 'user-1' });
    setWSConnectionStatus(client, false);

    await renderChat(client);

    expect(client.queryScheduledMessages).not.toHaveBeenCalled();
  });

  it('does not load for an anonymous user', async () => {
    const client = await getTestClientWithUser({ id: '!anon' });
    vi.spyOn(client, 'anonymous', 'get').mockReturnValue(true);

    await renderChat(client);

    expect(client.queryScheduledMessages).not.toHaveBeenCalled();
  });

  it('retries a failed load when the connection comes back', async () => {
    const client = await getTestClientWithUser({ id: 'user-1' });
    vi.mocked(client.queryScheduledMessages).mockRejectedValueOnce(new Error('offline'));
    captureManagerLogs();
    await renderChat(client);

    await reconnect(client);

    expect(client.queryScheduledMessages).toHaveBeenCalledTimes(2);
    expect(client.scheduledMessages.state.getLatestValue().isLoaded).toBe(true);
  });

  it('does not retry when the feature is disabled', async () => {
    const client = await getTestClientWithUser({ id: 'user-1' });
    vi.mocked(client.queryScheduledMessages).mockRejectedValueOnce(
      featureDisabledError(),
    );
    captureManagerLogs();
    await renderChat(client);

    await reconnect(client);

    expect(client.queryScheduledMessages).toHaveBeenCalledTimes(1);
    expect(client.scheduledMessages.state.getLatestValue().isDisabled).toBe(true);
  });

  it('does not load again when the healthy connection is reported again', async () => {
    const client = await getTestClientWithUser({ id: 'user-1' });
    await renderChat(client);

    await act(() => {
      setWSConnectionStatus(client, true);
    });

    expect(client.queryScheduledMessages).toHaveBeenCalledTimes(1);
  });

  it('does not load again on re-render', async () => {
    const client = await getTestClientWithUser({ id: 'user-1' });
    const { rerender } = await renderChat(client);

    await act(() => {
      rerender(<Chat client={client}>{null}</Chat>);
    });

    expect(client.queryScheduledMessages).toHaveBeenCalledTimes(1);
  });

  it('subscribes once and ends loaded under StrictMode', async () => {
    const client = await getTestClientWithUser({ id: 'user-1' });

    await renderChat(client, { strict: true });

    expect(client.scheduledMessages.state.getLatestValue().isLoaded).toBe(true);
    expect(countListeners(client, 'scheduled_message.created')).toBe(1);
    expect(countListeners(client, 'scheduled_message.sent')).toBe(1);
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

    expect(client.scheduledMessages.getFromState(scheduledMessage.id)).toEqual(
      scheduledMessage,
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
    const { unmount } = await renderChat(client);

    unmount();
    await reconnect(client);

    expect(client.scheduledMessages.hasSubscriptions).toBe(false);
    expect(countListeners(client, 'scheduled_message.created')).toBe(0);
    expect(countListeners(client, 'scheduled_message.failed')).toBe(0);
    expect(client.queryScheduledMessages).toHaveBeenCalledTimes(1);
  });

  it('logs and keeps rendering when the load fails', async () => {
    const client = await getTestClientWithUser({ id: 'user-1' });
    const error = new Error('boom');
    vi.mocked(client.queryScheduledMessages).mockRejectedValueOnce(error);
    const sink = captureManagerLogs();

    await renderChat(client);

    expect(sink).toHaveBeenCalledWith(
      'warn',
      expect.stringContaining(LOAD_FAILED_MESSAGE),
      expect.objectContaining({ error }),
    );
    expect(client.scheduledMessages.state.getLatestValue().lastQueryError).toBe(error);
  });
});
