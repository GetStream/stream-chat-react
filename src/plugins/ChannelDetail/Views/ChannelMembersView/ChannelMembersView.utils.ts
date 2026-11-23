import { type Channel, type ChannelMemberResponse, type UserResponse } from 'stream-chat';

export const CHANNEL_MEMBERS_QUERY_LIMIT = 100;

export const getMemberDisplayName = (member: ChannelMemberResponse) =>
  getUserDisplayName(member.user) || member.user_id || '';

export const getMemberUserId = (member: ChannelMemberResponse) =>
  member.user?.id || member.user_id;

export const getUserDisplayName = (user?: UserResponse) =>
  user?.name ||
  (user?.custom as { username?: string } | undefined)?.username ||
  user?.id ||
  '';

export const getMemberUserIds = (members: Record<string, ChannelMemberResponse>) =>
  Object.values(members)
    .map(getMemberUserId)
    .filter((userId): userId is string => !!userId);

export const canUpdateChannelMembers = (channel: Channel) =>
  channel.data?.own_capabilities?.includes('update-channel-members') ?? false;
