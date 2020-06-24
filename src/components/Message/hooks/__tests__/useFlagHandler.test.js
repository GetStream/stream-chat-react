import React from 'react';
import { renderHook } from '@testing-library/react-hooks';
import {
  getTestClientWithUser,
  generateChannel,
  generateMessage,
  generateUser,
} from 'mock-builders';
import { useFlagHandler } from '../useFlagHandler';
import { ChannelContext } from '../../../../context';

const alice = generateUser({ name: 'alice' });
const flagMessage = jest.fn();
const mouseEventMock = {
  preventDefault: jest.fn(() => {}),
};

async function renderUseHandleFlagHook(
  message = generateMessage(),
  notificationOpts,
  channelContextValue,
) {
  const client = await getTestClientWithUser(alice);
  client.flagMessage = flagMessage;
  const channel = generateChannel();
  const wrapper = ({ children }) => (
    <ChannelContext.Provider
      value={{
        channel,
        client,
        ...channelContextValue,
      }}
    >
      {children}
    </ChannelContext.Provider>
  );
  const { result } = renderHook(
    () => useFlagHandler(message, notificationOpts),
    { wrapper },
  );
  return result.current;
}
describe('useHandleFlag custom hook', () => {
  afterEach(jest.clearAllMocks);
  it('should generate function that handles mutes', async () => {
    const handleFlag = await renderUseHandleFlagHook();
    expect(typeof handleFlag).toBe('function');
  });

  it('should allow to flag a message and notify with custom success notification when it is successful', async () => {
    const message = generateMessage();
    const notify = jest.fn();
    flagMessage.mockImplementationOnce(() => Promise.resolve());
    const messageFlaggedNotification = 'Message flagged!';
    const getSuccessNotification = jest.fn(() => messageFlaggedNotification);
    const handleFlag = await renderUseHandleFlagHook(message, {
      notify,
      getSuccessNotification,
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
      notify,
      getErrorNotification,
    });
    await handleFlag(mouseEventMock);
    expect(flagMessage).toHaveBeenCalledWith(message.id);
    expect(notify).toHaveBeenCalledWith(messageFlagFailedNotification, 'error');
  });

  it('should allow to flag a user and notify with default error message when it fails', async () => {
    const message = generateMessage();
    const notify = jest.fn();
    flagMessage.mockImplementationOnce(() => Promise.reject());
    const defaultFlagMessageFailedNotification =
      'Error adding flag: Either the flag already exist or there is issue with network connection ...';
    const handleFlag = await renderUseHandleFlagHook(message, {
      notify,
    });
    await handleFlag(mouseEventMock);
    expect(flagMessage).toHaveBeenCalledWith(message.id);
    expect(notify).toHaveBeenCalledWith(
      defaultFlagMessageFailedNotification,
      'error',
    );
  });
});
