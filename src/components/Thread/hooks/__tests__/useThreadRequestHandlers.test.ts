import { renderHook } from '@testing-library/react';

import { useThreadRequestHandlers } from '../useThreadRequestHandlers';

const createThreadStub = () => {
  let channelValue: { requestHandlers?: Record<string, unknown> } = {};
  let threadValue: { requestHandlers?: Record<string, unknown> } = {};

  const channel = {
    cid: 'messaging:test',
    configState: {
      getLatestValue: () => channelValue,
      partialNext: (update: { requestHandlers?: Record<string, unknown> }) => {
        channelValue = { ...channelValue, ...update };
      },
    },
    getClient: () => ({
      deleteMessage: jest.fn().mockResolvedValue({ message: { id: 'fallback-delete' } }),
      updateMessage: jest.fn().mockResolvedValue({ message: { id: 'fallback-update' } }),
    }),
    markAsReadRequest: jest.fn().mockResolvedValue(null),
    sendMessage: jest.fn().mockResolvedValue({ message: { id: 'fallback-send' } }),
  } as const;

  const thread = {
    channel,
    configState: {
      getLatestValue: () => threadValue,
      partialNext: (update: { requestHandlers?: Record<string, unknown> }) => {
        threadValue = { ...threadValue, ...update };
      },
    },
    id: 'parent-1',
  } as const;

  return {
    getChannelRequestHandlers: () => channelValue.requestHandlers,
    getThreadRequestHandlers: () => threadValue.requestHandlers,
    thread,
  };
};

describe('useThreadRequestHandlers', () => {
  it('wires only one send/retry handler and passes parent_id to custom handler', async () => {
    const { getChannelRequestHandlers, thread } = createThreadStub();

    const doSendMessageRequest = jest
      .fn()
      .mockResolvedValue({ message: { id: 'custom-thread-send' } });

    renderHook(() =>
      useThreadRequestHandlers({
        doSendMessageRequest: doSendMessageRequest as never,
        threadInstance: thread as never,
      }),
    );

    const handlers = getChannelRequestHandlers();
    expect(handlers?.sendMessageRequest).toBeDefined();
    expect(handlers?.retrySendMessageRequest).toBe(handlers?.sendMessageRequest);

    const sendRequest = handlers?.sendMessageRequest as (params: {
      localMessage: { id: string; parent_id?: string };
      message?: { id?: string; parent_id?: string };
      options?: { skip_push?: boolean; parent_id?: string };
    }) => Promise<{ message: { id: string } }>;

    await sendRequest({
      localMessage: { id: 'm-1', parent_id: 'parent-1' },
      message: { id: 'm-1' },
      options: { skip_push: true },
    });

    expect(doSendMessageRequest).toHaveBeenCalledTimes(1);
    expect(doSendMessageRequest).toHaveBeenCalledWith(
      thread,
      expect.objectContaining({ parent_id: 'parent-1' }),
      expect.objectContaining({ parent_id: 'parent-1' }),
    );
  });

  it('removes managed handler when custom handler is unset', () => {
    const { getThreadRequestHandlers, thread } = createThreadStub();

    const doMarkReadRequest = jest.fn();

    const { rerender } = renderHook(
      ({ doMarkReadRequest }) =>
        useThreadRequestHandlers({
          doMarkReadRequest: doMarkReadRequest as never,
          threadInstance: thread as never,
        }),
      { initialProps: { doMarkReadRequest } },
    );

    expect(getThreadRequestHandlers()?.markReadRequest).toBeDefined();

    rerender({ doMarkReadRequest: undefined });

    expect(getThreadRequestHandlers()?.markReadRequest).toBeUndefined();
  });
});
