import React from 'react';
import { renderHook } from '@testing-library/react';

import { missingUseMuteHandlerParamsWarning, useMuteHandler } from '../useMuteHandler';

import { ChannelStateProvider } from '../../../../context/ChannelStateContext';
import { ChatProvider } from '../../../../context/ChatContext';
import {
  generateChannel,
  generateMessage,
  generateUser,
  getTestClientWithUser,
} from '../../../../mock-builders';

const alice = generateUser({ name: 'alice' });
const bob = generateUser({ name: 'bob' });
const muteUser = jest.fn();
const unmuteUser = jest.fn();
const mouseEventMock = {
  preventDefault: jest.fn(() => {}),
};

async function renderUseHandleMuteHook(
  message = generateMessage(),
  notificationOpts,
  channelStateContextValue,
) {
  const client = await getTestClientWithUser(alice);
  client.muteUser = muteUser;
  client.unmuteUser = unmuteUser;
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

  const { result } = renderHook(() => useMuteHandler(message, notificationOpts), {
    wrapper,
  });
  return result.current;
}

describe('useHandleMute custom hook', () => {
  afterEach(jest.clearAllMocks);
  it('should generate function that handles mutes', async () => {
    const handleMute = await renderUseHandleMuteHook();
    expect(typeof handleMute).toBe('function');
  });

  it('should throw a warning when there are missing parameters and the handler is called', async () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementationOnce(() => null);
    const handleMute = await renderUseHandleMuteHook(undefined);
    await handleMute(mouseEventMock);
    expect(consoleWarnSpy).toHaveBeenCalledWith(missingUseMuteHandlerParamsWarning);
  });

  it('should allow to mute a user and notify with custom success notification when it is successful', async () => {
    const message = generateMessage({ user: bob });
    const notify = jest.fn();
    const userMutedNotification = 'User muted!';
    const getMuteUserSuccessNotification = jest.fn(() => userMutedNotification);
    const handleMute = await renderUseHandleMuteHook(message, {
      getSuccessNotification: getMuteUserSuccessNotification,
      notify,
    });
    await handleMute(mouseEventMock);
    expect(muteUser).toHaveBeenCalledWith(bob.id);
    expect(notify).toHaveBeenCalledWith(userMutedNotification, 'success');
  });

  it('should allow to mute a user and notify with default success notification when it is successful', async () => {
    const message = generateMessage({ user: bob });
    // The key for the default success message, defined in the implementation
    const defaultSuccessMessage = '{{ user }} has been muted';
    const notify = jest.fn();
    const handleMute = await renderUseHandleMuteHook(message, { notify });
    await handleMute(mouseEventMock);
    expect(muteUser).toHaveBeenCalledWith(bob.id);
    expect(notify).toHaveBeenCalledWith(defaultSuccessMessage, 'success');
  });

  it('should allow to mute a user and notify with custom error message when muting a user fails', async () => {
    const message = generateMessage({ user: bob });
    const notify = jest.fn();
    muteUser.mockImplementationOnce(() => Promise.reject());
    const userMutedFailNotification = 'User mute failed!';
    const getErrorNotification = jest.fn(() => userMutedFailNotification);
    const handleMute = await renderUseHandleMuteHook(message, {
      getErrorNotification,
      notify,
    });
    await handleMute(mouseEventMock);
    expect(muteUser).toHaveBeenCalledWith(bob.id);
    expect(notify).toHaveBeenCalledWith(userMutedFailNotification, 'error');
  });

  it('should allow to mute a user and notify with default error message when muting a user fails', async () => {
    const message = generateMessage({ user: bob });
    const notify = jest.fn();
    muteUser.mockImplementationOnce(() => Promise.reject());
    // Defined in the implementation
    const defaultFailNotification = 'Error muting a user ...';
    const handleMute = await renderUseHandleMuteHook(message, {
      notify,
    });
    await handleMute(mouseEventMock);
    expect(muteUser).toHaveBeenCalledWith(bob.id);
    expect(notify).toHaveBeenCalledWith(defaultFailNotification, 'error');
  });

  it('should allow to unmute a user and notify with custom success notification when it is successful', async () => {
    const message = generateMessage({ user: bob });
    const notify = jest.fn();
    unmuteUser.mockImplementationOnce(() => Promise.resolve());
    const userUnmutedNotification = 'User unmuted!';
    const getSuccessNotification = jest.fn(() => userUnmutedNotification);
    const handleMute = await renderUseHandleMuteHook(
      message,
      {
        getSuccessNotification,
        notify,
      },
      { mutes: [{ target: { id: bob.id } }] },
    );
    await handleMute(mouseEventMock);
    expect(unmuteUser).toHaveBeenCalledWith(bob.id);
    expect(notify).toHaveBeenCalledWith(userUnmutedNotification, 'success');
  });

  it('should allow to unmute a user and notify with default success notification when it is successful', async () => {
    const message = generateMessage({ user: bob });
    const notify = jest.fn();
    unmuteUser.mockImplementationOnce(() => Promise.resolve());
    // Defined in the implementation
    const defaultSuccessNotification = '{{ user }} has been unmuted';
    const handleMute = await renderUseHandleMuteHook(
      message,
      {
        notify,
      },
      { mutes: [{ target: { id: bob.id } }] },
    );
    await handleMute(mouseEventMock);
    expect(unmuteUser).toHaveBeenCalledWith(bob.id);
    expect(notify).toHaveBeenCalledWith(defaultSuccessNotification, 'success');
  });

  it('should allow to unmute a user and notify with custom error message when it fails', async () => {
    const message = generateMessage({ user: bob });
    const notify = jest.fn();
    unmuteUser.mockImplementationOnce(() => Promise.reject());
    const userMutedFailNotification = 'User muted failed!';
    const getErrorNotification = jest.fn(() => userMutedFailNotification);
    const handleMute = await renderUseHandleMuteHook(
      message,
      {
        getErrorNotification,
        notify,
      },
      { mutes: [{ target: { id: bob.id } }] },
    );

    await handleMute(mouseEventMock);
    expect(unmuteUser).toHaveBeenCalledWith(bob.id);
    expect(notify).toHaveBeenCalledWith(userMutedFailNotification, 'error');
  });

  it('should allow to unmute a user and notify with default error message when it fails', async () => {
    const message = generateMessage({ user: bob });
    const notify = jest.fn();
    unmuteUser.mockImplementationOnce(() => Promise.reject());
    // Defined in the implementation
    const defaultFailNotification = 'Error unmuting a user ...';
    const handleMute = await renderUseHandleMuteHook(
      message,
      {
        notify,
      },
      {
        mutes: [{ target: { id: bob.id } }],
      },
    );
    await handleMute(mouseEventMock);
    expect(unmuteUser).toHaveBeenCalledWith(bob.id);
    expect(notify).toHaveBeenCalledWith(defaultFailNotification, 'error');
  });
});
