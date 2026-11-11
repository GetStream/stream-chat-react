import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';

import { usePinHandler } from '../usePinHandler';

import { ChannelActionProvider } from '../../../../context/ChannelActionContext';
import { ChannelStateProvider } from '../../../../context/ChannelStateContext';
import { ChatProvider } from '../../../../context/ChatContext';
import {
  generateMessage,
  generateUser,
  getTestClientWithUser,
  mockChannelActionContext,
  mockChannelStateContext,
  mockChatContext,
} from '../../../../mock-builders';
import type { Channel, LocalMessage, StreamChat } from 'stream-chat';

// `usePinHandler` updates the message optimistically through `updateMessage`, rolls back only
// the pin fields when the request fails, and rethrows so callers (the Pin message action) can
// show an error notification instead of a success one.

const alice = generateUser({ name: 'alice' });
let client: StreamChat;
let channel: Channel;
// Writes to the channel state like `Channel`'s own `updateMessage`, so tests can read it back.
const updateMessage = vi.fn((message: LocalMessage) =>
  channel.state.addMessageSorted(message, true),
);
const mouseEventMock = fromPartial<React.BaseSyntheticEvent>({
  preventDefault: vi.fn(() => {}),
});

function renderUsePinHandlerHook(message: LocalMessage) {
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

// Adds a message to the channel state and returns it as stored, like the message a
// `Message` component renders with.
const seedMessage = (overrides: Parameters<typeof generateMessage>[0]) => {
  const message = generateMessage(overrides);
  channel.state.addMessageSorted(message, true);
  return getStoredMessage(message.id)!;
};

const getStoredMessage = (id: string) => channel.state.findMessage(id);

// Keeps the pin/unpin request pending; the returned function rejects it.
const mockPendingRequest = (method: 'pinMessage' | 'unpinMessage') => {
  let rejectRequest: (error: Error) => void = () => {};
  vi.spyOn(client, method).mockReturnValue(
    new Promise((_, reject) => {
      rejectRequest = reject;
    }),
  );
  return rejectRequest;
};

// Starts `handlePin` without awaiting it, so assertions can run while the request is pending.
const startHandlePin = (handlePin: ReturnType<typeof usePinHandler>['handlePin']) => {
  let pending: ReturnType<typeof handlePin> = undefined;
  act(() => {
    pending = handlePin(mouseEventMock);
  });
  return pending;
};

describe('usePinHandler custom hook', () => {
  beforeAll(async () => {
    client = await getTestClientWithUser(alice);
    channel = client.channel('messaging', 'pin-handler-test');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it.each([
    { method: 'pinMessage', pinned: false },
    { method: 'unpinMessage', pinned: true },
  ] as const)(
    'should update the message optimistically when $method succeeds',
    async ({ method, pinned }) => {
      const requestSpy = vi.spyOn(client, method).mockResolvedValue(fromPartial({}));
      const message = seedMessage({ pinned });
      const { handlePin } = renderUsePinHandlerHook(message);
      await handlePin(mouseEventMock);
      expect(requestSpy).toHaveBeenCalledWith(message);
      expect(getStoredMessage(message.id)).toEqual(
        expect.objectContaining({ pinned: !pinned }),
      );
    },
  );

  it.each([
    { method: 'pinMessage', pinned: false },
    { method: 'unpinMessage', pinned: true },
  ] as const)(
    'should roll back and throw when $method fails',
    async ({ method, pinned }) => {
      const rejectRequest = mockPendingRequest(method);
      const message = seedMessage({ pinned });
      const { handlePin } = renderUsePinHandlerHook(message);
      const pending = startHandlePin(handlePin);
      expect(getStoredMessage(message.id)).toEqual(
        expect.objectContaining({ pinned: !pinned }),
      );
      rejectRequest(new Error('request failed'));
      await expect(pending).rejects.toThrow('request failed');
      expect(getStoredMessage(message.id)).toEqual(expect.objectContaining({ pinned }));
    },
  );

  it('should keep updates that arrived while the request was pending when rolling back', async () => {
    const rejectRequest = mockPendingRequest('pinMessage');
    const message = seedMessage({ pinned: false, text: 'original' });
    const { handlePin } = renderUsePinHandlerHook(message);
    const pending = startHandlePin(handlePin);
    channel.state.addMessageSorted(
      { ...getStoredMessage(message.id)!, text: 'edited while pinning' },
      true,
    );
    rejectRequest(new Error('pin failed'));
    await expect(pending).rejects.toThrow('pin failed');
    expect(getStoredMessage(message.id)).toEqual(
      expect.objectContaining({ pinned: false, text: 'edited while pinning' }),
    );
  });

  it('should keep a pin state that changed while the request was pending', async () => {
    const rejectRequest = mockPendingRequest('unpinMessage');
    const newerPinner = generateUser();
    const message = seedMessage({ pinned: true, pinned_by: generateUser() });
    const { handlePin } = renderUsePinHandlerHook(message);
    const pending = startHandlePin(handlePin);
    channel.state.addMessageSorted(
      { ...getStoredMessage(message.id)!, pinned: true, pinned_by: newerPinner },
      true,
    );
    rejectRequest(new Error('unpin failed'));
    await expect(pending).rejects.toThrow('unpin failed');
    expect(getStoredMessage(message.id)?.pinned_by).toEqual(newerPinner);
  });

  it('should keep a newer pin with the same pinned value that arrived while pinning', async () => {
    const rejectRequest = mockPendingRequest('pinMessage');
    const newerPinner = generateUser();
    const newerPinnedAt = new Date(Date.now() + 60_000);
    const message = seedMessage({ pinned: false });
    const { handlePin } = renderUsePinHandlerHook(message);
    const pending = startHandlePin(handlePin);
    channel.state.addMessageSorted(
      {
        ...getStoredMessage(message.id)!,
        pinned: true,
        pinned_at: newerPinnedAt,
        pinned_by: newerPinner,
      },
      true,
    );
    rejectRequest(new Error('pin failed'));
    await expect(pending).rejects.toThrow('pin failed');
    expect(getStoredMessage(message.id)).toEqual(
      expect.objectContaining({ pinned: true, pinned_by: newerPinner }),
    );
    expect(getStoredMessage(message.id)?.pinned_at?.getTime()).toBe(
      newerPinnedAt.getTime(),
    );
  });
});
