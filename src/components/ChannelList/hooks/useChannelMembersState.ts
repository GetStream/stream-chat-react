import type { Channel, ChannelMemberResponse, MembersState } from 'stream-chat';
import { useStateStore } from '../../../store';

const selector = ({ members }: MembersState) => ({ members });

/**
 * The channel's members, kept current by subscribing to `channel.state`: every change re-renders,
 * whatever its source (an event, a query response, a presence or user update).
 */
export function useChannelMembersState(
  channel: Channel,
): Record<string, ChannelMemberResponse>;
export function useChannelMembersState(
  channel?: Channel | undefined,
): Record<string, ChannelMemberResponse> | undefined;
export function useChannelMembersState(channel?: Channel) {
  return useStateStore(channel?.state, selector)?.members;
}
