import type { Channel, ChannelMemberResponse, EventTypes, ExtendableGenerics } from 'stream-chat';
import { useSelectedChannelState } from './useSelectedChannelState';

const selector = <SCG extends ExtendableGenerics>(c: Channel<SCG>) => c.state.membership;
const keys: EventTypes[] = ['member.updated'];

export function useChannelMembershipState<SCG extends ExtendableGenerics>(
  channel: Channel<SCG>,
): ChannelMemberResponse<SCG>;
export function useChannelMembershipState<SCG extends ExtendableGenerics>(
  channel?: Channel<SCG> | undefined,
): ChannelMemberResponse<SCG> | undefined;
export function useChannelMembershipState<SCG extends ExtendableGenerics>(channel?: Channel<SCG>) {
  return useSelectedChannelState({ channel, selector, stateChangeEventKeys: keys });
}
