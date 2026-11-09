import type { Channel, ChannelMemberResponse, MembershipState } from 'stream-chat';
import { useStateStore } from '../../../store';

const selector = ({ membership }: MembershipState) => ({ membership });

/**
 * The current user's membership in the channel, kept current by subscribing to `channel.state`:
 * every change re-renders, whatever its source (an event or a query response).
 *
 * @param channel - Channel to read the membership of.
 * @returns The current user's membership.
 */
export function useChannelMembershipState(channel: Channel): ChannelMemberResponse;
/**
 * Same as the overload above, for a channel that may be missing.
 *
 * @param channel - Channel to read the membership of.
 * @returns The current user's membership, or undefined without a channel.
 */
export function useChannelMembershipState(
  channel?: Channel | undefined,
): ChannelMemberResponse | undefined;
export function useChannelMembershipState(channel?: Channel) {
  return useStateStore(channel?.state, selector)?.membership;
}
