import { fromPartial } from '@total-typescript/shoehorn';
import type { ChannelMemberResponse, UserResponse } from 'stream-chat';

import { isMemberOnline } from '../onlineMembers';

const member = (id: string, online = false) =>
  fromPartial<ChannelMemberResponse>({ user: { id, online }, user_id: id });

describe('isMemberOnline', () => {
  it('is true for a member whose user is online', () => {
    expect(isMemberOnline(member('bob', true), {})).toBe(true);
  });

  it('is true for an offline member who watches the channel', () => {
    const watchers = { bob: fromPartial<UserResponse>({ id: 'bob' }) };

    expect(isMemberOnline(member('bob'), watchers)).toBe(true);
  });

  it('reads only the watchers own entries, not inherited object properties', () => {
    expect(isMemberOnline(member('constructor'), {})).toBe(false);
    expect(
      isMemberOnline(member('constructor'), {
        constructor: fromPartial<UserResponse>({ id: 'constructor' }),
      }),
    ).toBe(true);
  });
});
