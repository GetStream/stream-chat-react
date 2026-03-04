import React from 'react';
import { renderHook } from '@testing-library/react';

import { useDeleteHandler } from '../useDeleteHandler';
import { ChannelStateProvider } from '../../../../context/ChannelStateContext';
import { ChatProvider } from '../../../../context/ChatContext';
import {
  generateChannel,
  generateMessage,
  generateUser,
  getTestClientWithUser,
} from '../../../../mock-builders';

let channel;
let client;
const testMessage = generateMessage();
const ingestItem = jest.fn();

function renderUseDeleteHandler(message = testMessage) {
  const wrapper = ({ children }) => (
    <ChatProvider value={{ client }}>
      <ChannelStateProvider value={{ channel }}>{children}</ChannelStateProvider>
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
    channel = generateChannel();
    channel.messagePaginator = { ingestItem };
  });

  afterEach(jest.clearAllMocks);

  it('should generate function that handles message deletion', async () => {
    const handleDelete = await renderUseDeleteHandler();
    expect(typeof handleDelete).toBe('function');
  });

  it('should delete a message by its id', async () => {
    const message = generateMessage();
    const deleteMessageOptions = { deleteForMe: true, hard: false };
    const handleDelete = await renderUseDeleteHandler(message);
    await handleDelete(deleteMessageOptions);
    expect(client.deleteMessage).toHaveBeenCalledWith(message.id, deleteMessageOptions);
  });

  it('should ingest the message returned by the deletion request', async () => {
    const deleteMessageResponse = generateMessage();
    client.deleteMessage.mockImplementationOnce(() =>
      Promise.resolve({ message: deleteMessageResponse }),
    );
    const handleDelete = await renderUseDeleteHandler(testMessage);
    await handleDelete();
    expect(ingestItem).toHaveBeenCalledWith(deleteMessageResponse);
  });
});
