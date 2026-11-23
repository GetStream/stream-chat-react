import type {
  ChannelMemberResponse,
  ChannelWatchState,
  MembersState,
  UserResponse,
} from 'stream-chat';

/**
 * Whether a user is online in a channel: `user.online`, or watching the channel, which only a
 * connected user can do. Watching covers channels loaded without `presence: true`, whose
 * `user.online` is not updated after load. The header, the member list and the member profile all
 * use this, so they agree.
 */
export const isUserOnline = (
  user: UserResponse | null | undefined,
  watchers: ChannelWatchState['watchers'] = {},
) =>
  !!user?.online ||
  (!!user?.id && Object.prototype.hasOwnProperty.call(watchers, user.id));

/** Whether the member's user is online in the channel (see `isUserOnline`). */
export const isMemberOnline = (
  member: ChannelMemberResponse,
  watchers: ChannelWatchState['watchers'],
) => isUserOnline(member.user, watchers);

/** The loaded members (`channel.state.members`) that are online. */
export const getOnlineMembers = ({
  members,
  watchers,
}: Pick<MembersState, 'members'> & Pick<ChannelWatchState, 'watchers'>) =>
  Object.values(members).filter((member) => isMemberOnline(member, watchers));
