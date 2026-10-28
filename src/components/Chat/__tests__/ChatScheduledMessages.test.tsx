import React, { StrictMode } from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { ErrorFromResponse } from 'stream-chat';
import type { APIErrorResponse, StreamChat } from 'stream-chat';

import { Chat } from '..';
import {
  dispatchConnectionChangedEvent,
  dispatchConnectionRecoveredEvent,
  dispatchScheduledMessageEvent,
  generateScheduledMessage,
  getTestClient,
  getTestClientWithUser,
} from '../../../mock-builders';

const renderChat = async (client: StreamChat, { strict = false } = {}) => {
  const chat = <Chat client={client}>{null}</Chat>;

  let result!: ReturnType<typeof render>;
  await act(() => {
    result = render(strict ? <StrictMode>{chat}</StrictMode> : chat);
  });
  return result;
};

const countListeners = (client: StreamChat, type: string) =>
  client.listeners[type]?.length ?? 0;

const featureDisabledError = () =>
  new ErrorFromResponse<APIErrorResponse>('failed', {
    code: 114,
    response: {
      data: {
        code: 114,
        duration: '',
        exception_fields: { reason: 'scheduled_messages_disabled' },
        message: 'failed',
        more_info: '',
        StatusCode: 400,
      },
    } as ErrorFromResponse<APIErrorResponse>['response'],
    status: 400,
  });

describe('Chat scheduled messages wiring', () => {
  afterEach(cleanup);

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
    await act(() => {
      dispatchConnectionChangedEvent(client, true);
    });

    expect(client.queryScheduledMessages).toHaveBeenCalledTimes(1);
  });

  it('does not load when the connection goes offline', async () => {
    const client = getTestClient();
    await renderChat(client);

    await client.connectUser({ id: 'user-1' }, 'token');
    await act(() => {
      dispatchConnectionChangedEvent(client, false);
    });

    expect(client.queryScheduledMessages).not.toHaveBeenCalled();
  });

  it('does not load for an anonymous user', async () => {
    const client = await getTestClientWithUser({ id: '!anon' });
    client.anonymous = true;

    await renderChat(client);

    expect(client.queryScheduledMessages).not.toHaveBeenCalled();
  });

  it('retries a failed load when the connection comes back', async () => {
    const client = await getTestClientWithUser({ id: 'user-1' });
    vi.mocked(client.queryScheduledMessages).mockRejectedValueOnce(new Error('offline'));
    await renderChat(client);

    await act(() => {
      dispatchConnectionChangedEvent(client, true);
    });

    expect(client.queryScheduledMessages).toHaveBeenCalledTimes(2);
    expect(client.scheduledMessages.state.getLatestValue().isLoaded).toBe(true);
  });

  it('retries a failed load on connection.recovered', async () => {
    const client = await getTestClientWithUser({ id: 'user-1' });
    vi.mocked(client.queryScheduledMessages).mockRejectedValueOnce(new Error('offline'));
    await renderChat(client);

    await act(() => {
      dispatchConnectionRecoveredEvent(client);
    });

    expect(client.scheduledMessages.state.getLatestValue().isLoaded).toBe(true);
  });

  it('does not retry or warn when the feature is disabled', async () => {
    const client = await getTestClientWithUser({ id: 'user-1' });
    vi.mocked(client.queryScheduledMessages).mockRejectedValueOnce(
      featureDisabledError(),
    );
    const loggerSpy = vi.spyOn(client, 'logger');
    await renderChat(client);

    await act(() => {
      dispatchConnectionChangedEvent(client, true);
    });

    expect(client.queryScheduledMessages).toHaveBeenCalledTimes(1);
    expect(client.scheduledMessages.state.getLatestValue().isDisabled).toBe(true);
    expect(loggerSpy).not.toHaveBeenCalledWith(
      'warn',
      'scheduledMessages: load failed',
      expect.anything(),
    );
  });

  it('does not load again when the connection comes back after a successful load', async () => {
    const client = await getTestClientWithUser({ id: 'user-1' });
    await renderChat(client);

    await act(() => {
      dispatchConnectionChangedEvent(client, true);
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

  it('queries and subscribes once under StrictMode', async () => {
    const client = await getTestClientWithUser({ id: 'user-1' });

    await renderChat(client, { strict: true });

    expect(client.queryScheduledMessages).toHaveBeenCalledTimes(1);
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

  it('unsubscribes on unmount', async () => {
    const client = await getTestClientWithUser({ id: 'user-1' });
    const connectionChangedListeners = countListeners(client, 'connection.changed');
    const connectionRecoveredListeners = countListeners(client, 'connection.recovered');
    const { unmount } = await renderChat(client);

    unmount();

    expect(client.scheduledMessages.hasSubscriptions).toBe(false);
    expect(countListeners(client, 'scheduled_message.created')).toBe(0);
    expect(countListeners(client, 'connection.changed')).toBe(connectionChangedListeners);
    expect(countListeners(client, 'connection.recovered')).toBe(
      connectionRecoveredListeners,
    );
  });

  it('logs and keeps rendering when the load fails', async () => {
    const client = await getTestClientWithUser({ id: 'user-1' });
    const error = new Error('boom');
    vi.mocked(client.queryScheduledMessages).mockRejectedValueOnce(error);
    const loggerSpy = vi.spyOn(client, 'logger');

    await renderChat(client);

    expect(loggerSpy).toHaveBeenCalledWith(
      'warn',
      'scheduledMessages: load failed',
      expect.objectContaining({ error }),
    );
    expect(client.scheduledMessages.state.getLatestValue().lastQueryError).toBe(error);
  });
});
