import type { ChannelMemberResponse, UserResponse } from 'stream-chat';

export const generateMember = (
  options: Partial<ChannelMemberResponse> & { user: Partial<UserResponse> },
) =>
  ({
    invited: false,
    is_moderator: false,
    role: 'member',
    user: options.user,
    user_id: options.user.id,
    ...options,
  }) as ChannelMemberResponse;
