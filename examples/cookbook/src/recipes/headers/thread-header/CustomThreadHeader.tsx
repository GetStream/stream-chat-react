import type { ThreadState } from 'stream-chat';
import {
  Avatar,
  TypingIndicatorHeader,
  useChannel,
  useChannelPreviewInfo,
  useDisplayedTypingUsers,
  useStateStore,
  useThreadContext,
  WorkspaceNavigationBackButton,
  WorkspaceNavigationCloseButton,
} from 'stream-chat-react';
import './CustomThreadHeader.css';

const threadStateSelector = ({ participants, replyCount }: ThreadState) => ({
  participants,
  replyCount,
});

export const CustomThreadHeader = () => {
  const channel = useChannel();
  const thread = useThreadContext();
  const { participants = [], replyCount = 0 } =
    useStateStore(thread?.state, threadStateSelector) ?? {};
  const { displayTitle } = useChannelPreviewInfo({ channel });

  // Others typing a reply in this thread, kept for the same hide delay as the default header after
  // they stop. Empty while typing events are disabled for the channel.
  const someoneIsTyping = useDisplayedTypingUsers(channel, thread?.id).length > 0;

  return (
    <div className='cookbook-thread-header'>
      <WorkspaceNavigationBackButton />
      <div className='cookbook-thread-header__participants'>
        {participants.map(({ user }) =>
          user ? (
            <Avatar
              imageUrl={user.image}
              key={user.id}
              size='sm'
              userName={user.name ?? user.id}
            />
          ) : null,
        )}
      </div>
      <div className='cookbook-thread-header__content'>
        <div className='cookbook-thread-header__title'>Thread</div>
        <div className='cookbook-thread-header__subtitle'>
          {someoneIsTyping ? (
            <TypingIndicatorHeader threadList />
          ) : (
            `${displayTitle} · ${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}`
          )}
        </div>
      </div>
      <WorkspaceNavigationCloseButton />
    </div>
  );
};
