import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import {
  getTestClientWithUser,
  generateChannel,
  generateMessage,
  generateUser,
} from 'mock-builders';
import { ChannelContext } from '../../../../context';
import { useActionHandler, handleActionWarning } from '../useActionHandler';

const alice = generateUser({ name: 'alice' });
const sendAction = jest.fn();
const removeMessage = jest.fn();
const updateMessage = jest.fn();
const mouseEventMock = {
  preventDefault: jest.fn(() => {}),
};

async function renderUseHandleActionHook(message = generateMessage()) {
  const client = await getTestClientWithUser(alice);
  const channel = generateChannel({
    sendAction,
  });
  const wrapper = ({ children }) => (
    <ChannelContext.Provider
      value={{
        channel,
        client,
        removeMessage,
        updateMessage,
      }}
    >
      {children}
    </ChannelContext.Provider>
  );
  const { result } = renderHook(() => useActionHandler(message), { wrapper });
  return result.current;
}

describe('useHandleAction custom hook', () => {
  afterEach(jest.clearAllMocks);
  it('should return function that handles actions', async () => {
    const handleAction = await renderUseHandleActionHook();
    expect(typeof handleAction).toBe('function');
  });

  it('should warn user if the hooks was not initialized with a defined message', async () => {
    jest.spyOn(console, 'warn').mockImplementationOnce(() => null);
    const handleAction = await renderUseHandleActionHook(null);
    await handleAction('action', 'value', mouseEventMock);
    expect(console.warn).toHaveBeenCalledWith(handleActionWarning);
  });

  it('should update message after an action', async () => {
    const currentMessage = generateMessage();
    const updatedMessage = generateMessage();
    const action = {
      name: 'action',
      value: 'value',
    };
    sendAction.mockImplementationOnce(() =>
      Promise.resolve({ message: updatedMessage }),
    );
    const handleAction = await renderUseHandleActionHook(currentMessage);
    await handleAction(action.name, action.value, mouseEventMock);
    expect(sendAction).toHaveBeenCalledWith(currentMessage.id, {
      [action.name]: action.value,
    });
    expect(updateMessage).toHaveBeenCalledWith(updatedMessage);
  });

  it('should fallback to original message after an action fails', async () => {
    const currentMessage = generateMessage();
    const action = {
      name: 'action',
      value: 'value',
    };
    sendAction.mockImplementationOnce(() => Promise.resolve(undefined));
    const handleAction = await renderUseHandleActionHook(currentMessage);
    await handleAction(action.name, action.value, mouseEventMock);
    expect(sendAction).toHaveBeenCalledWith(currentMessage.id, {
      [action.name]: action.value,
    });
    expect(removeMessage).toHaveBeenCalledWith(currentMessage);
  });
});
