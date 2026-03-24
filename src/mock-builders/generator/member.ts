import type { ChannelMemberResponse } from 'stream-chat';

export const generateMember = (options: Partial<ChannelMemberResponse> & { user: any }) =>
  ({
    invited: false,
    is_moderator: false,
    role: 'member',
    user: options.user,
    user_id: options.user.id,
    ...options,
  }) as ChannelMemberResponse;
