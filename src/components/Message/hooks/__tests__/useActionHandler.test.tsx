import React from 'react';
import { renderHook } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';

import { handleActionWarning, useActionHandler } from '../useActionHandler';

import { ChatProvider } from '../../../../context/ChatContext';
import { ChannelActionProvider } from '../../../../context/ChannelActionContext';
import { ChannelStateProvider } from '../../../../context/ChannelStateContext';
import {
  generateChannel,
  generateMessage,
  generateUser,
  getTestClientWithUser,
  mockChannelActionContext,
  mockChannelStateContext,
  mockChatContext,
} from '../../../../mock-builders';
import type { GenerateChannelOptions } from '../../../../mock-builders';

const alice = generateUser({ name: 'alice' });
const sendAction = vi.fn();
const removeMessage = vi.fn();
const updateMessage = vi.fn();
const mouseEventMock = fromPartial<React.BaseSyntheticEvent>({
  preventDefault: vi.fn(() => {}),
});

async function renderUseHandleActionHook(message: any = generateMessage()) {
  const client = await getTestClientWithUser(alice);
  const channel = generateChannel(
    fromPartial<GenerateChannelOptions>({
      sendAction,
    }),
  );
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ChatProvider value={mockChatContext({ client })}>
      <ChannelStateProvider value={mockChannelStateContext({ channel })}>
        <ChannelActionProvider
          value={mockChannelActionContext({ removeMessage, updateMessage })}
        >
          {children}
        </ChannelActionProvider>
      </ChannelStateProvider>
    </ChatProvider>
  );
  const { result } = renderHook(() => useActionHandler(message), { wrapper });
  return result.current;
}

describe('useHandleAction custom hook', () => {
  afterEach(vi.clearAllMocks);
  it('should return function that handles actions', async () => {
    const handleAction = await renderUseHandleActionHook();
    expect(typeof handleAction).toBe('function');
  });

  it('should warn user if the hooks was not initialized with a defined message', async () => {
    vi.spyOn(console, 'warn').mockImplementationOnce(() => null);
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
