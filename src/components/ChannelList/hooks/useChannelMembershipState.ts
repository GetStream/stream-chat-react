import type { Channel, EventType } from 'stream-chat';
import { useSelectedChannelState } from './useSelectedChannelState';

const selector = (c: Channel) => c.state.membership;
const keys: EventType[] = ['member.updated'];

export function useChannelMembershipState(channel?: Channel) {
  return useSelectedChannelState({ channel, selector, stateChangeEventKeys: keys });
}
