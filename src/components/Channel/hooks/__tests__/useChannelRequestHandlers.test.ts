import { renderHook } from '@testing-library/react';

import { useChannelRequestHandlers } from '../useChannelRequestHandlers';

const createChannelStub = () => {
  let value: { requestHandlers?: Record<string, unknown> } = {};

  const channel = {
    cid: 'messaging:test',
    configState: {
      getLatestValue: () => value,
      partialNext: (update: { requestHandlers?: Record<string, unknown> }) => {
        value = { ...value, ...update };
      },
    },
    markAsReadRequest: jest.fn().mockResolvedValue(null),
    sendMessage: jest.fn().mockResolvedValue({ message: { id: 'fallback-send' } }),
  } as const;

  return {
    channel,
    getRequestHandlers: () => value.requestHandlers,
  };
};

describe('useChannelRequestHandlers', () => {
  it('registers only one send/retry handler and updates it when props change', async () => {
    const { channel, getRequestHandlers } = createChannelStub();

    const doSendMessageRequestA = jest
      .fn()
      .mockResolvedValue({ message: { id: 'custom-send-a' } });

    const { rerender } = renderHook(
      ({ doSendMessageRequest }) =>
        useChannelRequestHandlers({
          channel: channel as never,
          doSendMessageRequest: doSendMessageRequest as never,
        }),
      { initialProps: { doSendMessageRequest: doSendMessageRequestA } },
    );

    const first = getRequestHandlers();
    expect(first?.sendMessageRequest).toBeDefined();
    expect(first?.retrySendMessageRequest).toBe(first?.sendMessageRequest);

    const doSendMessageRequestB = jest
      .fn()
      .mockResolvedValue({ message: { id: 'custom-send-b' } });

    rerender({ doSendMessageRequest: doSendMessageRequestB });

    const second = getRequestHandlers();
    expect(second?.sendMessageRequest).toBeDefined();
    expect(second?.retrySendMessageRequest).toBe(second?.sendMessageRequest);

    const sendRequest = second?.sendMessageRequest as (params: {
      message?: { id?: string };
      options?: { skip_push?: boolean };
    }) => Promise<{ message: { id: string } }>;

    const result = await sendRequest({
      message: { id: 'message-1' },
      options: { skip_push: true },
    });

    expect(result.message.id).toBe('custom-send-b');
    expect(doSendMessageRequestA).toHaveBeenCalledTimes(0);
    expect(doSendMessageRequestB).toHaveBeenCalledTimes(1);
  });

  it('removes managed handlers when custom handlers are unset', () => {
    const { channel, getRequestHandlers } = createChannelStub();

    const doMarkReadRequest = jest.fn();

    const { rerender } = renderHook(
      ({ doMarkReadRequest }) =>
        useChannelRequestHandlers({
          channel: channel as never,
          doMarkReadRequest: doMarkReadRequest as never,
        }),
      { initialProps: { doMarkReadRequest } },
    );

    expect(getRequestHandlers()?.markReadRequest).toBeDefined();

    rerender({ doMarkReadRequest: undefined });

    expect(getRequestHandlers()?.markReadRequest).toBeUndefined();
  });
});
