import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import { getTestClient, generateMessage, generateChannel } from 'mock-builders';
import { ChannelContext } from '../../../../context';
import { useDeleteHandler } from '../useDeleteHandler';

const deleteMessage = jest.fn(() => Promise.resolve(generateMessage()));
const updateMessage = jest.fn();
const mouseEventMock = {
  preventDefault: jest.fn(() => {}),
};

async function renderUseDeleteHandler(message = generateMessage()) {
  const client = await getTestClient();
  client.deleteMessage = deleteMessage;
  const channel = generateChannel({
    updateMessage,
  });
  const wrapper = ({ children }) => (
    <ChannelContext.Provider
      value={{
        channel,
        client,
        updateMessage,
      }}
    >
      {children}
    </ChannelContext.Provider>
  );
  const { result } = renderHook(() => useDeleteHandler(message), { wrapper });
  return result.current;
}

describe('useDeleteHandler custom hook', () => {
  afterEach(jest.clearAllMocks);
  it('should generate function that handles message deletion', async () => {
    const handleDelete = await renderUseDeleteHandler();
    expect(typeof handleDelete).toBe('function');
  });

  it('should prevent default mouse click event from bubbling', async () => {
    const handleDelete = await renderUseDeleteHandler();
    await handleDelete(mouseEventMock);
    expect(mouseEventMock.preventDefault).toHaveBeenCalledWith();
  });

  it('should delete a message by its id', async () => {
    const message = generateMessage();
    const handleDelete = await renderUseDeleteHandler(message);
    await handleDelete(mouseEventMock);
    expect(deleteMessage).toHaveBeenCalledWith(message.id);
  });

  it('should update the message with the result of deletion', async () => {
    const message = generateMessage();
    const deletedMessage = generateMessage();
    deleteMessage.mockImplementationOnce(() =>
      Promise.resolve({ message: deletedMessage }),
    );
    const handleDelete = await renderUseDeleteHandler(message);
    await handleDelete(mouseEventMock);
    expect(updateMessage).toHaveBeenCalledWith(deletedMessage);
  });
});
