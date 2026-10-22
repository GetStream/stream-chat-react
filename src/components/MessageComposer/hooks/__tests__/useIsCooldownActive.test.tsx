import React from 'react';
import { act, renderHook, type RenderHookResult } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';

// Imported through the package entry because the hook is a public export.
import { useIsCooldownActive } from '../../../../index';

import { Chat } from '../../../Chat';
import { Channel } from '../../../Channel';
import { initClientWithChannels } from '../../../../mock-builders';

describe('useIsCooldownActive', () => {
  const setup = async () => {
    const {
      channels: [channel],
      client,
    } = await initClientWithChannels();

    const wrapper = ({ children }) => (
      <Chat client={client}>
        <Channel channel={channel}>{children}</Channel>
      </Chat>
    );

    let result: RenderHookResult<boolean, unknown>;
    await act(() => {
      result = renderHook(() => useIsCooldownActive(), { wrapper });
    });
    return { channel, ...result };
  };

  it('is false when no cooldown is active', async () => {
    const { result } = await setup();
    expect(result.current).toBe(false);
  });

  it('follows the channel cooldown timer', async () => {
    const { channel, result } = await setup();

    await act(() => {
      channel.cooldownTimer.state.next(fromPartial({ cooldownRemaining: 10 }));
    });
    expect(result.current).toBe(true);

    await act(() => {
      channel.cooldownTimer.state.next(fromPartial({ cooldownRemaining: 0 }));
    });
    expect(result.current).toBe(false);
  });
});
