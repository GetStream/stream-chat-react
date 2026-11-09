import type { Channel, ChannelMemberResponse, MembersState } from 'stream-chat';
import { useStateStore } from '../../../store';

const selector = ({ members }: MembersState) => ({ members });

/**
 * The channel's members, kept current by subscribing to `channel.state`: every change re-renders,
 * whatever its source (an event, a query response, a presence or user update).
 *
 * @param channel - Channel to read the members of.
 * @returns The members record of `channel.state`.
 */
export function useChannelMembersState(
  channel: Channel,
): Record<string, ChannelMemberResponse>;
/**
 * Same as the overload above, for a channel that may be missing.
 *
 * @param channel - Channel to read the members of.
 * @returns The members record of `channel.state`, or undefined without a channel.
 */
export function useChannelMembersState(
  channel?: Channel | undefined,
): Record<string, ChannelMemberResponse> | undefined;
export function useChannelMembersState(channel?: Channel) {
  return useStateStore(channel?.state, selector)?.members;
}
