import type { Channel, ChannelMemberResponse, EventTypes } from 'stream-chat';
import { useSelectedChannelState } from './useSelectedChannelState';

const selector = (c: Channel) => c.state.members;
const keys: EventTypes[] = [
  'member.updated',
  'member.added',
  'member.removed',
  'user.banned',
  'user.unbanned',
  'user.deleted',
  'user.presence.changed',
];

export function useChannelMembersState(
  channel: Channel,
): Record<string, ChannelMemberResponse>;
export function useChannelMembersState(
  channel?: Channel | undefined,
): Record<string, ChannelMemberResponse> | undefined;
export function useChannelMembersState(channel?: Channel) {
  return useSelectedChannelState({ channel, selector, stateChangeEventKeys: keys });
}
