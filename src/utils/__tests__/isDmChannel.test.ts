import { fromPartial } from '@total-typescript/shoehorn';
import type { Channel, ChannelState } from 'stream-chat';
import { describe, expect, it } from 'vitest';
import { isDmChannel } from '../isDmChannel';

describe('isDmChannel', () => {
  it('returns true for one-member channels', () => {
    const channel = fromPartial<Channel>({
      data: { member_count: 1 },
      state: { members: {} },
    });

    expect(isDmChannel({ channel })).toBe(true);
  });

  it('returns true for two-member channels that include the current user', () => {
    const members = fromPartial<ChannelState['members']>({
      'user-1': { user: { id: 'user-1' } },
      'user-2': { user: { id: 'user-2' } },
    });

    expect(
      isDmChannel({
        channel: fromPartial<Channel>({
          data: { member_count: 2 },
          state: { members },
        }),
        ownUserId: 'user-1',
      }),
    ).toBe(true);
  });

  it('does not throw when channel state members are not loaded', () => {
    const channel = fromPartial<Channel>({
      data: { member_count: 2 },
      state: {},
    });

    expect(() => isDmChannel({ channel, ownUserId: 'user-1' })).not.toThrow();
    expect(isDmChannel({ channel, ownUserId: 'user-1' })).toBe(false);
  });

  it('returns false for group channels', () => {
    const members = fromPartial<ChannelState['members']>({
      'user-1': { user: { id: 'user-1' } },
      'user-2': { user: { id: 'user-2' } },
      'user-3': { user: { id: 'user-3' } },
    });

    expect(
      isDmChannel({
        channel: fromPartial<Channel>({
          data: { member_count: 3 },
          state: { members },
        }),
        ownUserId: 'user-1',
      }),
    ).toBe(false);
  });
});
