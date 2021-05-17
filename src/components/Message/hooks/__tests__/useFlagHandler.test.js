import React from 'react';
import { renderHook } from '@testing-library/react-hooks';

import { missingUseFlagHandlerParameterWarning, useFlagHandler } from '../useFlagHandler';

import { ChatProvider } from '../../../../context/ChatContext';
import { ChannelStateProvider } from '../../../../context/ChannelStateContext';
import {
  generateChannel,
  generateMessage,
  generateUser,
  getTestClientWithUser,
} from '../../../../mock-builders';

const alice = generateUser({ name: 'alice' });
const flagMessage = jest.fn();
const mouseEventMock = {
  preventDefault: jest.fn(() => {}),
};

async function renderUseHandleFlagHook(
  message = generateMessage(),
  notificationOpts,
  channelStateContextValue,
) {
  const client = await getTestClientWithUser(alice);
  client.flagMessage = flagMessage;
  const channel = generateChannel();
  const wrapper = ({ children }) => (
    <ChatProvider value={{ client }}>
      <ChannelStateProvider
        value={{
          channel,
          ...channelStateContextValue,
        }}
      >
        {children}
      </ChannelStateProvider>
    </ChatProvider>
  );
  const { result } = renderHook(() => useFlagHandler(message, notificationOpts), { wrapper });
  return result.current;
}
describe('useHandleFlag custom hook', () => {
  afterEach(jest.clearAllMocks);
  it('should generate function that handles mutes', async () => {
    const handleFlag = await renderUseHandleFlagHook();
    expect(typeof handleFlag).toBe('function');
  });

  it('should throw a warning when there are missing parameters and the handler is called', async () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementationOnce(() => null);
    const handleFlag = await renderUseHandleFlagHook(undefined);
    await handleFlag(mouseEventMock);
    expect(consoleWarnSpy).toHaveBeenCalledWith(missingUseFlagHandlerParameterWarning);
  });

  it('should allow to flag a message and notify with custom success notification when it is successful', async () => {
    const message = generateMessage();
    const notify = jest.fn();
    flagMessage.mockImplementationOnce(() => Promise.resolve());
    const messageFlaggedNotification = 'Message flagged!';
    const getSuccessNotification = jest.fn(() => messageFlaggedNotification);
    const handleFlag = await renderUseHandleFlagHook(message, {
      getSuccessNotification,
      notify,
    });
    await handleFlag(mouseEventMock);
    expect(flagMessage).toHaveBeenCalledWith(message.id);
    expect(notify).toHaveBeenCalledWith(messageFlaggedNotification, 'success');
  });

  it('should allow to flag a message and notify with default success notification when it is successful', async () => {
    const message = generateMessage();
    const notify = jest.fn();
    flagMessage.mockImplementationOnce(() => Promise.resolve());
    const defaultSuccessNotification = 'Message has been successfully flagged';
    const handleFlag = await renderUseHandleFlagHook(message, {
      notify,
    });
    await handleFlag(mouseEventMock);
    expect(flagMessage).toHaveBeenCalledWith(message.id);
    expect(notify).toHaveBeenCalledWith(defaultSuccessNotification, 'success');
  });

  it('should allow to flag a message and notify with custom error message when it fails', async () => {
    const message = generateMessage();
    const notify = jest.fn();
    flagMessage.mockImplementationOnce(() => Promise.reject());
    const messageFlagFailedNotification = 'Message flagged failed!';
    const getErrorNotification = jest.fn(() => messageFlagFailedNotification);
    const handleFlag = await renderUseHandleFlagHook(message, {
      getErrorNotification,
      notify,
    });
    await handleFlag(mouseEventMock);
    expect(flagMessage).toHaveBeenCalledWith(message.id);
    expect(notify).toHaveBeenCalledWith(messageFlagFailedNotification, 'error');
  });

  it('should allow to flag a user and notify with default error message when it fails', async () => {
    const message = generateMessage();
    const notify = jest.fn();
    flagMessage.mockImplementationOnce(() => Promise.reject());
    const defaultFlagMessageFailedNotification = 'Error adding flag';
    const handleFlag = await renderUseHandleFlagHook(message, {
      notify,
    });
    await handleFlag(mouseEventMock);
    expect(flagMessage).toHaveBeenCalledWith(message.id);
    expect(notify).toHaveBeenCalledWith(defaultFlagMessageFailedNotification, 'error');
  });
});
