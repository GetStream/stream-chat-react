import { fromPartial } from '@total-typescript/shoehorn';
import type { ChannelState } from 'stream-chat';
import { describe, expect, it } from 'vitest';
import { isDmChannel } from '../isDmChannel';

describe('isDmChannel', () => {
  it('returns true for one-member channels', () => {
    expect(isDmChannel({ memberCount: 1 })).toBe(true);
  });

  it('returns true for two-member channels that include the current user', () => {
    const members = fromPartial<ChannelState['members']>({
      'user-1': { user: { id: 'user-1' } },
      'user-2': { user: { id: 'user-2' } },
    });

    expect(
      isDmChannel({
        memberCount: 2,
        members,
        userId: 'user-1',
      }),
    ).toBe(true);
  });

  it('returns false for group channels', () => {
    const members = fromPartial<ChannelState['members']>({
      'user-1': { user: { id: 'user-1' } },
      'user-2': { user: { id: 'user-2' } },
      'user-3': { user: { id: 'user-3' } },
    });

    expect(
      isDmChannel({
        memberCount: 3,
        members,
        userId: 'user-1',
      }),
    ).toBe(false);
  });
});
