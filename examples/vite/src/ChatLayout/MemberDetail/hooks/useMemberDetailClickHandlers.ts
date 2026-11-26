import { useContext, useMemo } from 'react';
import type { Channel as StreamChannel } from 'stream-chat';
import type { MessageListProps } from 'stream-chat-react';

import { MemberDetailContext } from '../MemberDetailContext';
import { getMentionedUserId } from '../utils';

// The message list props that open a member's profile from `channel`'s messages. The virtualized
// list doesn't forward them, so its avatars and mentions open nothing.
export const useMemberDetailClickHandlers = (
  channel: StreamChannel,
): Pick<MessageListProps, 'onMentionsClick' | 'onUserClick'> => {
  const openMemberDetail = useContext(MemberDetailContext);
  return useMemo(
    () =>
      openMemberDetail
        ? {
            onMentionsClick: (event, message) =>
              openMemberDetail(getMentionedUserId(event, message), event, channel),
            onUserClick: (event, user) => openMemberDetail(user.id, event, channel),
          }
        : {},
    [channel, openMemberDetail],
  );
};
