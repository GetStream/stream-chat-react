import React from 'react';
import { renderHook } from '@testing-library/react';

import { useDeleteHandler } from '../useDeleteHandler';
import { ChannelInstanceProvider } from '../../../../context/ChannelInstanceContext';
import { ChatProvider } from '../../../../context/ChatContext';
import { ThreadProvider } from '../../../Threads/ThreadContext';
import {
  generateMessage,
  generateUser,
  getTestClientWithUser,
} from '../../../../mock-builders';

let channel;
let client;
const testMessage = generateMessage();
const ingestItem = jest.fn();
const deleteMessageWithLocalUpdate = jest.fn();

function renderUseDeleteHandler({ message = testMessage, thread } = {}) {
  const wrapper = ({ children }) => (
    <ChatProvider value={{ client }}>
      <ChannelInstanceProvider value={{ channel }}>
        <ThreadProvider thread={thread}>{children}</ThreadProvider>
      </ChannelInstanceProvider>
    </ChatProvider>
  );

  const { result } = renderHook(() => useDeleteHandler(message), { wrapper });

  return result.current;
}

describe('useDeleteHandler custom hook', () => {
  beforeAll(async () => {
    client = await getTestClientWithUser(generateUser());
    jest
      .spyOn(client, 'deleteMessage')
      .mockImplementation(() => Promise.resolve({ message: testMessage }));
    channel = client.channel('messaging', 'test-channel');
    channel.messagePaginator = { ingestItem };
    channel.deleteMessageWithLocalUpdate = deleteMessageWithLocalUpdate;
  });

  afterEach(jest.clearAllMocks);

  it('should generate function that handles message deletion', async () => {
    const handleDelete = await renderUseDeleteHandler();
    expect(typeof handleDelete).toBe('function');
  });

  it('uses deleteMessageWithLocalUpdate on channel when available', async () => {
    const message = generateMessage();
    const deleteMessageOptions = { deleteForMe: true, hard: false };
    const handleDelete = await renderUseDeleteHandler({ message });
    await handleDelete(deleteMessageOptions);
    expect(deleteMessageWithLocalUpdate).toHaveBeenCalledWith({
      localMessage: expect.objectContaining({ id: message.id }),
      options: deleteMessageOptions,
    });
    expect(client.deleteMessage).not.toHaveBeenCalled();
  });

  it('uses deleteMessageWithLocalUpdate on thread when thread context is set', async () => {
    const threadDeleteWithLocalUpdate = jest.fn().mockResolvedValue(undefined);
    const thread = {
      deleteMessageWithLocalUpdate: threadDeleteWithLocalUpdate,
      id: 'parent-1',
      markRead: jest.fn(),
      ownUnreadCount: 0,
    };
    const message = generateMessage();
    const handleDelete = await renderUseDeleteHandler({ message, thread });

    await handleDelete();

    expect(threadDeleteWithLocalUpdate).toHaveBeenCalledWith({
      localMessage: expect.objectContaining({ id: message.id }),
      options: undefined,
    });
    expect(deleteMessageWithLocalUpdate).not.toHaveBeenCalled();
  });

  it('falls back to client.deleteMessage and ingests response when wrapper is unavailable', async () => {
    const deleteMessageResponse = generateMessage();
    channel.deleteMessageWithLocalUpdate = undefined;
    client.deleteMessage.mockImplementationOnce(() =>
      Promise.resolve({ message: deleteMessageResponse }),
    );
    const handleDelete = await renderUseDeleteHandler({ message: testMessage });

    await handleDelete();

    expect(client.deleteMessage).toHaveBeenCalledWith(testMessage.id, undefined);
    expect(ingestItem).toHaveBeenCalledWith(
      expect.objectContaining({ id: deleteMessageResponse.id }),
    );

    channel.deleteMessageWithLocalUpdate = deleteMessageWithLocalUpdate;
  });
});
