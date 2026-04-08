import React from 'react';
import { renderHook } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';

import { missingUseMuteHandlerParamsWarning, useMuteHandler } from '../useMuteHandler';

import { ChannelStateProvider } from '../../../../context/ChannelStateContext';
import { ChatProvider } from '../../../../context/ChatContext';
import {
  generateChannel,
  generateMessage,
  generateUser,
  getTestClientWithUser,
  mockChannelStateContext,
  mockChatContext,
} from '../../../../mock-builders';
import type { LocalMessage, MessageResponse, Mute } from 'stream-chat';
import type { ChannelStateContextValue } from '../../../../context';

const alice = generateUser({ name: 'alice' });
const bob = generateUser({ name: 'bob' });
const muteUser = vi.fn();
const unmuteUser = vi.fn();
const mouseEventMock = fromPartial<React.BaseSyntheticEvent>({
  preventDefault: vi.fn(() => {}),
});

async function renderUseHandleMuteHook(
  message: LocalMessage | undefined = generateMessage() as MessageResponse & LocalMessage,
  channelStateContextValue?: Partial<ChannelStateContextValue> & Record<string, unknown>,
) {
  const client = await getTestClientWithUser(alice);
  client.muteUser = muteUser;
  client.unmuteUser = unmuteUser;
  const channel = generateChannel();

  const wrapper = ({ children }: { children?: React.ReactNode }) => (
    <ChatProvider value={mockChatContext({ client })}>
      <ChannelStateProvider
        value={mockChannelStateContext({
          channel,
          ...channelStateContextValue,
        })}
      >
        {children}
      </ChannelStateProvider>
    </ChatProvider>
  );

  const { result } = renderHook(() => useMuteHandler(message), {
    wrapper,
  });
  return result.current;
}

describe('useHandleMute custom hook', () => {
  afterEach(vi.clearAllMocks);
  it('should generate function that handles mutes', async () => {
    const handleMute = await renderUseHandleMuteHook();
    expect(typeof handleMute).toBe('function');
  });

  it('should throw a warning when there are missing parameters and the handler is called', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementationOnce(() => null);
    const handleMute = await renderUseHandleMuteHook(undefined);
    await handleMute(mouseEventMock);
    expect(consoleWarnSpy).toHaveBeenCalledWith(missingUseMuteHandlerParamsWarning);
  });

  it('should allow to mute a user when it is successful', async () => {
    const message = generateMessage({ user: bob }) as MessageResponse & LocalMessage;
    const handleMute = await renderUseHandleMuteHook(message);
    await handleMute(mouseEventMock);
    expect(muteUser).toHaveBeenCalledWith(bob.id);
  });

  it('should throw when muting a user fails', async () => {
    const message = generateMessage({ user: bob }) as MessageResponse & LocalMessage;
    muteUser.mockImplementationOnce(() => Promise.reject(new Error('mute failed')));
    const handleMute = await renderUseHandleMuteHook(message);
    await expect(handleMute(mouseEventMock)).rejects.toThrow('mute failed');
    expect(muteUser).toHaveBeenCalledWith(bob.id);
  });

  it('should allow to unmute a user when it is successful', async () => {
    const message = generateMessage({ user: bob }) as MessageResponse & LocalMessage;
    unmuteUser.mockImplementationOnce(() => Promise.resolve());
    const handleMute = await renderUseHandleMuteHook(message, {
      mutes: [fromPartial<Mute>({ target: { id: bob.id } })],
    });
    await handleMute(mouseEventMock);
    expect(unmuteUser).toHaveBeenCalledWith(bob.id);
  });

  it('should throw when unmuting a user fails', async () => {
    const message = generateMessage({ user: bob }) as MessageResponse & LocalMessage;
    unmuteUser.mockImplementationOnce(() => Promise.reject(new Error('unmute failed')));
    const handleMute = await renderUseHandleMuteHook(message, {
      mutes: [fromPartial<Mute>({ target: { id: bob.id } })],
    });
    await expect(handleMute(mouseEventMock)).rejects.toThrow('unmute failed');
    expect(unmuteUser).toHaveBeenCalledWith(bob.id);
  });
});
