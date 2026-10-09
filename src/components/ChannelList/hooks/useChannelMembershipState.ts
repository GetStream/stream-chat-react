import type { Channel, ChannelMemberResponse, MembershipState } from 'stream-chat';
import { useStateStore } from '../../../store';

const selector = ({ membership }: MembershipState) => ({ membership });

/**
 * The current user's membership in the channel, kept current by subscribing to `channel.state`:
 * every change re-renders, whatever its source (an event or a query response).
 */
export function useChannelMembershipState(channel: Channel): ChannelMemberResponse;
export function useChannelMembershipState(
  channel?: Channel | undefined,
): ChannelMemberResponse | undefined;
export function useChannelMembershipState(channel?: Channel) {
  return useStateStore(channel?.state, selector)?.membership;
}
