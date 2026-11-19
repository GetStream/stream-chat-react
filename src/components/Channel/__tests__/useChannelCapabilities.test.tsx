import React from 'react';
import { act, renderHook } from '@testing-library/react';
import type { Channel, StreamChat } from 'stream-chat';

import { ChannelInstanceProvider } from '../../../context';
import { getTestClientWithUser } from '../../../mock-builders';
import { useChannelCapabilities } from '../hooks/useChannelCapabilities';

describe('useChannelCapabilities', () => {
  let client: StreamChat;
  let contextChannel: Channel;
  let otherChannel: Channel;

  beforeEach(async () => {
    client = await getTestClientWithUser({ id: 'own-user' });
    contextChannel = client.channel('messaging', 'context');
    contextChannel.data = { own_capabilities: ['send-message'] };
    otherChannel = client.channel('messaging', 'other');
    otherChannel.data = { own_capabilities: ['update-channel'] };
  });

  const renderCapabilities = (
    params: Parameters<typeof useChannelCapabilities>[0],
    { withChannelProvider = true } = {},
  ) =>
    renderHook(() => useChannelCapabilities(params), {
      wrapper: ({ children }: React.PropsWithChildren) =>
        withChannelProvider ? (
          <ChannelInstanceProvider value={{ channel: contextChannel }}>
            {children}
          </ChannelInstanceProvider>
        ) : (
          <>{children}</>
        ),
    });

  it('reads the context channel by its cid', () => {
    const { result } = renderCapabilities({ cid: contextChannel.cid });

    expect([...result.current]).toEqual(['send-message']);
  });

  it("is empty for a cid that isn't the context channel's", () => {
    const { result } = renderCapabilities({ cid: otherChannel.cid });

    expect(result.current.size).toBe(0);
  });

  it('reads the given channel without a channel provider or Chat', () => {
    const { result } = renderCapabilities(
      { channel: otherChannel },
      { withChannelProvider: false },
    );

    expect([...result.current]).toEqual(['update-channel']);
  });

  it('prefers the given channel over cid', () => {
    const { result } = renderCapabilities({
      channel: otherChannel,
      cid: contextChannel.cid,
    });

    expect([...result.current]).toEqual(['update-channel']);
  });

  it('is empty without a channel or cid', () => {
    expect(renderCapabilities({ cid: undefined }).result.current.size).toBe(0);
    expect(
      renderCapabilities({ channel: undefined, cid: undefined }).result.current.size,
    ).toBe(0);
  });

  it('updates when the capabilities change', () => {
    const { result } = renderCapabilities({ channel: otherChannel });

    act(() => {
      otherChannel.data = { ...otherChannel.data, own_capabilities: ['delete-channel'] };
    });

    expect([...result.current]).toEqual(['delete-channel']);
  });
});
