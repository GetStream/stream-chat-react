import type { ChannelMemberResponse, ChannelWatchState, MembersState } from 'stream-chat';

/**
 * Whether the member's user is online: `member.user.online`, or watching the channel, which only a
 * connected user can do. Watching covers channels loaded without `presence: true`, whose
 * `user.online` is not updated after load.
 */
export const isMemberOnline = (
  member: ChannelMemberResponse,
  watchers: ChannelWatchState['watchers'],
) =>
  !!member.user?.online ||
  (!!member.user?.id && Object.prototype.hasOwnProperty.call(watchers, member.user.id));

/** The loaded members (`channel.state.members`) that are online. */
export const getOnlineMembers = ({
  members,
  watchers,
}: Pick<MembersState, 'members'> & Pick<ChannelWatchState, 'watchers'>) =>
  Object.values(members).filter((member) => isMemberOnline(member, watchers));
