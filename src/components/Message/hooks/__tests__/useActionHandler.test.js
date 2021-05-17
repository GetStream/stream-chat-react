import React from 'react';
import { renderHook } from '@testing-library/react-hooks';

import { handleActionWarning, useActionHandler } from '../useActionHandler';

import { ChatProvider } from '../../../../context/ChatContext';
import { ChannelActionProvider } from '../../../../context/ChannelActionContext';
import { ChannelStateProvider } from '../../../../context/ChannelStateContext';
import {
  generateChannel,
  generateMessage,
  generateUser,
  getTestClientWithUser,
} from '../../../../mock-builders';

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
    <ChatProvider value={{ client }}>
      <ChannelStateProvider value={{ channel }}>
        <ChannelActionProvider value={{ removeMessage, updateMessage }}>
          {children}
        </ChannelActionProvider>
      </ChannelStateProvider>
    </ChatProvider>
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
    sendAction.mockImplementationOnce(() => Promise.resolve({ message: updatedMessage }));
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
