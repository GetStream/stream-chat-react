import { type Channel, type ChannelMemberResponse, type UserResponse } from 'stream-chat';

export const CHANNEL_MEMBERS_QUERY_LIMIT = 100;

export const getMemberDisplayName = (member: ChannelMemberResponse) =>
  getUserDisplayName(member.user) || member.user_id || '';

export const getMemberUserId = (member: ChannelMemberResponse) =>
  member.user?.id || member.user_id;

export const getUserDisplayName = (user?: UserResponse) =>
  user?.name || user?.username || user?.id || '';

export const getChannelMemberUserIds = (channel: Channel) =>
  Object.values(channel.state?.members ?? {})
    .map((member) => member.user?.id || member.user_id)
    .filter((userId): userId is string => !!userId);

export const canUpdateChannelMembers = (channel: Channel) =>
  channel.data?.own_capabilities?.includes('update-channel-members') ?? false;
