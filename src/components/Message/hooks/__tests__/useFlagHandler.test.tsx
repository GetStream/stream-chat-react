import React from 'react';
import { renderHook } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';

import { missingUseFlagHandlerParameterWarning, useFlagHandler } from '../useFlagHandler';

import { ChatProvider } from '../../../../context/ChatContext';
import { ChannelStateProvider } from '../../../../context/ChannelStateContext';
import {
  generateChannel,
  generateMessage,
  generateUser,
  getTestClientWithUser,
  mockChannelStateContext,
  mockChatContext,
} from '../../../../mock-builders';
import type { LocalMessage } from 'stream-chat';

const alice = generateUser({ name: 'alice' });
const flagMessage = vi.fn();
const mouseEventMock = fromPartial<React.BaseSyntheticEvent>({
  preventDefault: vi.fn(() => {}),
});

async function renderUseHandleFlagHook(
  message?: LocalMessage,
  channelStateContextValue?: Record<string, unknown>,
) {
  const client = await getTestClientWithUser(alice);
  client.flagMessage = flagMessage;
  const channel = generateChannel();
  const wrapper = ({ children }: React.PropsWithChildren) => (
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
  const { result } = renderHook(() => useFlagHandler(message), {
    wrapper,
  });
  return result.current;
}
describe('useHandleFlag custom hook', () => {
  afterEach(vi.clearAllMocks);
  it('should generate function that handles mutes', async () => {
    const handleFlag = await renderUseHandleFlagHook();
    expect(typeof handleFlag).toBe('function');
  });

  it('should throw a warning when there are missing parameters and the handler is called', async () => {
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementationOnce(() => null);
    const handleFlag = await renderUseHandleFlagHook(undefined);
    await handleFlag(mouseEventMock);
    expect(consoleWarnSpy).toHaveBeenCalledWith(missingUseFlagHandlerParameterWarning);
  });

  it('should allow to flag a message when it is successful', async () => {
    const message = generateMessage();
    flagMessage.mockImplementationOnce(() => Promise.resolve());
    const handleFlag = await renderUseHandleFlagHook(message);
    await handleFlag(mouseEventMock);
    expect(flagMessage).toHaveBeenCalledWith(message.id);
  });

  it('should throw when flagging fails', async () => {
    const message = generateMessage();
    flagMessage.mockImplementationOnce(() => Promise.reject(new Error('flag failed')));
    const handleFlag = await renderUseHandleFlagHook(message);
    await expect(handleFlag(mouseEventMock)).rejects.toThrow('flag failed');
    expect(flagMessage).toHaveBeenCalledWith(message.id);
  });
});
