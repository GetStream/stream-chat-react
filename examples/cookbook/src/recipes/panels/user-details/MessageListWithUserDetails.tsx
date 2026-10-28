import { useMemo } from 'react';
import { MessageList } from 'stream-chat-react';
import type { MessageListProps } from 'stream-chat-react';
import { useSidePanel } from '../../../base/SidePanel';

/**
 * A message list whose avatars and user mentions open the user's profile in the side panel.
 * Opening another user replaces the one shown.
 */
export const MessageListWithUserDetails = () => {
  const { openUserProfile } = useSidePanel();

  const handlers = useMemo(
    (): Pick<MessageListProps, 'onMentionsClick' | 'onUserClick'> => ({
      // Runs for a click anywhere in a message that mentions someone: only a click on a user
      // mention, which carries the user's id, opens a profile.
      onMentionsClick: (event) => {
        const mention = (event.target as HTMLElement).closest<HTMLElement>(
          '[data-user-id]',
        );
        if (mention?.dataset.userId) openUserProfile(mention.dataset.userId);
      },
      onUserClick: (_event, user) => openUserProfile(user.id),
    }),
    [openUserProfile],
  );

  return <MessageList {...handlers} />;
};
