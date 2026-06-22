import { fromPartial } from '@total-typescript/shoehorn';
import type { Channel, ChannelMemberResponse } from 'stream-chat';

import {
  canUpdateChannelMembers,
  getChannelMemberUserIds,
  getMemberDisplayName,
  getUserDisplayName,
} from '../ChannelMembersView.utils';

describe('ChannelMembersView.utils', () => {
  describe('canUpdateChannelMembers', () => {
    it('returns true when update-channel-members capability is present', () => {
      const channel = fromPartial<Channel>({
        data: { own_capabilities: ['update-channel-members'] },
      });

      expect(canUpdateChannelMembers(channel)).toBe(true);
    });

    it('returns false when update-channel-members capability is missing', () => {
      const channel = fromPartial<Channel>({
        data: { own_capabilities: ['read-channel'] },
      });

      expect(canUpdateChannelMembers(channel)).toBe(false);
    });

    it('returns false when own_capabilities is undefined', () => {
      const channel = fromPartial<Channel>({
        data: {},
      });

      expect(canUpdateChannelMembers(channel)).toBe(false);
    });
  });

  describe('getUserDisplayName', () => {
    it('prefers name over username and id', () => {
      expect(
        getUserDisplayName({ id: 'user-1', name: 'Alice', username: 'alice_user' }),
      ).toBe('Alice');
    });

    it('falls back to username then id', () => {
      expect(getUserDisplayName({ id: 'user-1', username: 'alice_user' })).toBe(
        'alice_user',
      );
      expect(getUserDisplayName({ id: 'user-1' })).toBe('user-1');
    });
  });

  describe('getMemberDisplayName', () => {
    it('uses nested user display name', () => {
      const member = fromPartial<ChannelMemberResponse>({
        user: { id: 'user-1', name: 'Alice' },
        user_id: 'user-1',
      });

      expect(getMemberDisplayName(member)).toBe('Alice');
    });

    it('falls back to user_id', () => {
      const member = fromPartial<ChannelMemberResponse>({
        user_id: 'user-2',
      });

      expect(getMemberDisplayName(member)).toBe('user-2');
    });
  });

  describe('getChannelMemberUserIds', () => {
    it('collects user ids from channel members', () => {
      const channel = fromPartial<Channel>({
        state: {
          members: {
            'user-1': { user: { id: 'user-1' }, user_id: 'user-1' },
            'user-2': { user_id: 'user-2' },
          },
        },
      });

      expect(getChannelMemberUserIds(channel)).toEqual(['user-1', 'user-2']);
    });

    it('filters out members without ids', () => {
      const channel = fromPartial<Channel>({
        state: {
          members: {
            invalid: {},
            'user-1': { user: { id: 'user-1' }, user_id: 'user-1' },
          },
        },
      });

      expect(getChannelMemberUserIds(channel)).toEqual(['user-1']);
    });
  });
});
