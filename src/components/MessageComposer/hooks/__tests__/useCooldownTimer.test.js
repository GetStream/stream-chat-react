import React from 'react';
import { act, renderHook } from '@testing-library/react';

import { useCooldownRemaining } from '../useCooldownRemaining';

import { Chat } from '../../../Chat';
import { Channel } from '../../../Channel';
import { initClientWithChannels } from '../../../../mock-builders';

describe('useCooldownRemaining', () => {
  const setup = async ({ channelData = {} } = {}) => {
    const {
      channels: [channel],
      client,
    } = await initClientWithChannels({
      channelsData: [{ channel: channelData }],
    });

    const wrapper = ({ children }) => (
      <Chat client={client}>
        <Channel channel={channel}>{children}</Channel>
      </Chat>
    );

    let result;
    await act(() => {
      result = renderHook(() => useCooldownRemaining(), { wrapper });
    });
    return { channel, ...result };
  };

  it('should return 0 when no cooldown is active', async () => {
    const { result } = await setup();
    expect(result.current).toBe(0);
  });

  it('should return the cooldown remaining value from channel state', async () => {
    const { channel, result } = await setup();
    await act(() => {
      channel.cooldownTimer.state.next({ cooldownRemaining: 25 });
    });
    expect(result.current).toBe(25);
  });

  it('should update when cooldown remaining changes', async () => {
    const { channel, result } = await setup();

    await act(() => {
      channel.cooldownTimer.state.next({ cooldownRemaining: 30 });
    });
    expect(result.current).toBe(30);

    await act(() => {
      channel.cooldownTimer.state.next({ cooldownRemaining: 15 });
    });
    expect(result.current).toBe(15);

    await act(() => {
      channel.cooldownTimer.state.next({ cooldownRemaining: 0 });
    });
    expect(result.current).toBe(0);
  });
});
