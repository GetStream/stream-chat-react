import type { Channel, ChannelMemberResponse, EventTypes } from 'stream-chat';
import { useSelectedChannelState } from './useSelectedChannelState';

const selector = (c: Channel) => c.state.membership;
const keys: EventTypes[] = ['member.updated'];

export function useChannelMembershipState(channel: Channel): ChannelMemberResponse;
export function useChannelMembershipState(
  channel?: Channel | undefined,
): ChannelMemberResponse | undefined;
export function useChannelMembershipState(channel?: Channel) {
  return useSelectedChannelState({ channel, selector, stateChangeEventKeys: keys });
}
