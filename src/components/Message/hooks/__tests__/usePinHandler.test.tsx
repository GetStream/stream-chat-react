import React from 'react';
import { renderHook } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';

import { usePinHandler } from '../usePinHandler';

import { ChannelActionProvider } from '../../../../context/ChannelActionContext';
import { ChannelStateProvider } from '../../../../context/ChannelStateContext';
import { ChatProvider } from '../../../../context/ChatContext';
import {
  generateChannel,
  generateMessage,
  generateUser,
  getTestClientWithUser,
  mockChannelActionContext,
  mockChannelStateContext,
  mockChatContext,
} from '../../../../mock-builders';
import type { LocalMessage, MessageResponse } from 'stream-chat';

const alice = generateUser({ name: 'alice' });
const pinMessage = vi.fn();
const unpinMessage = vi.fn();
const updateMessage = vi.fn();
const mouseEventMock = fromPartial<React.BaseSyntheticEvent>({
  preventDefault: vi.fn(() => {}),
});

async function renderUsePinHandlerHook(message: LocalMessage) {
  const client = await getTestClientWithUser(alice);
  client.pinMessage = pinMessage;
  client.unpinMessage = unpinMessage;
  const channel = generateChannel();

  const wrapper = ({ children }: { children?: React.ReactNode }) => (
    <ChatProvider value={mockChatContext({ client })}>
      <ChannelActionProvider value={mockChannelActionContext({ updateMessage })}>
        <ChannelStateProvider
          value={mockChannelStateContext({
            channel,
            channelCapabilities: { 'pin-message': true },
          })}
        >
          {children}
        </ChannelStateProvider>
      </ChannelActionProvider>
    </ChatProvider>
  );

  const { result } = renderHook(() => usePinHandler(message), { wrapper });
  return result.current;
}

describe('usePinHandler custom hook', () => {
  afterEach(vi.clearAllMocks);

  it('should pin the message and update it optimistically', async () => {
    const message = generateMessage({ pinned: false }) as MessageResponse & LocalMessage;
    const { handlePin } = await renderUsePinHandlerHook(message);
    await handlePin(mouseEventMock);
    expect(pinMessage).toHaveBeenCalledWith(message);
    expect(updateMessage).toHaveBeenCalledTimes(1);
    expect(updateMessage).toHaveBeenCalledWith(expect.objectContaining({ pinned: true }));
  });

  it('should roll back and throw when pinning fails', async () => {
    const message = generateMessage({ pinned: false }) as MessageResponse & LocalMessage;
    pinMessage.mockImplementationOnce(() => Promise.reject(new Error('pin failed')));
    const { handlePin } = await renderUsePinHandlerHook(message);
    await expect(handlePin(mouseEventMock)).rejects.toThrow('pin failed');
    expect(updateMessage).toHaveBeenCalledTimes(2);
    expect(updateMessage).toHaveBeenLastCalledWith(message);
  });

  it('should unpin the message and update it optimistically', async () => {
    const message = generateMessage({ pinned: true }) as MessageResponse & LocalMessage;
    const { handlePin } = await renderUsePinHandlerHook(message);
    await handlePin(mouseEventMock);
    expect(unpinMessage).toHaveBeenCalledWith(message);
    expect(updateMessage).toHaveBeenCalledTimes(1);
    expect(updateMessage).toHaveBeenCalledWith(
      expect.objectContaining({ pinned: false }),
    );
  });

  it('should roll back and throw when unpinning fails', async () => {
    const message = generateMessage({ pinned: true }) as MessageResponse & LocalMessage;
    unpinMessage.mockImplementationOnce(() => Promise.reject(new Error('unpin failed')));
    const { handlePin } = await renderUsePinHandlerHook(message);
    await expect(handlePin(mouseEventMock)).rejects.toThrow('unpin failed');
    expect(updateMessage).toHaveBeenCalledTimes(2);
    expect(updateMessage).toHaveBeenLastCalledWith(message);
  });
});
