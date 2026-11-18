import type { ChannelMemberResponse, MembersState } from 'stream-chat';

/** Whether the member's user is online anywhere (`member.user.online`). */
export const isMemberOnline = (member: ChannelMemberResponse) => !!member.user?.online;

/** The loaded members (`channel.state.members`) that are online. */
export const getOnlineMembers = (members: MembersState['members']) =>
  Object.values(members).filter(isMemberOnline);
