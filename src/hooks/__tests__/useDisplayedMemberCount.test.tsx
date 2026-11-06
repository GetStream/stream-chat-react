import { act, renderHook } from '@testing-library/react';
import { fromPartial } from '@total-typescript/shoehorn';
import type { Channel, ChannelStateData } from 'stream-chat';

import { generateChannelState } from '../../mock-builders';
import { useDisplayedMemberCount } from '../useDisplayedMemberCount';

const makeChannel = (overrides: Partial<ChannelStateData>) => {
  const state = generateChannelState(overrides);
  const channel = fromPartial<Channel>({ state });
  return { channel, state };
};

describe('useDisplayedMemberCount', () => {
  it('returns the member count while the active member count is unknown', () => {
    const { channel } = makeChannel({ memberCount: 10 });

    const { result } = renderHook(() => useDisplayedMemberCount(channel));

    expect(result.current).toBe(10);
  });

  it('returns the active member count once the channel has one', () => {
    const { channel } = makeChannel({ activeMemberCount: 8, memberCount: 10 });

    const { result } = renderHook(() => useDisplayedMemberCount(channel));

    expect(result.current).toBe(8);
  });

  it('returns zero when no member is active', () => {
    const { channel } = makeChannel({ activeMemberCount: 0, memberCount: 3 });

    const { result } = renderHook(() => useDisplayedMemberCount(channel));

    expect(result.current).toBe(0);
  });

  it('follows changes of the channel state', () => {
    const { channel, state } = makeChannel({ memberCount: 10 });
    const { result } = renderHook(() => useDisplayedMemberCount(channel));

    act(() => state.partialNext({ activeMemberCount: 8 }));
    expect(result.current).toBe(8);

    act(() => state.partialNext({ activeMemberCount: 9, memberCount: 11 }));
    expect(result.current).toBe(9);
  });
});
