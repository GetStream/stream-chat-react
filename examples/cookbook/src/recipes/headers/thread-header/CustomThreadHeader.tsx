import type { ThreadState } from 'stream-chat';
import {
  Avatar,
  TypingIndicatorHeader,
  useChannel,
  useDisplayedTypingUsers,
  useStateStore,
  useThreadContext,
  useThreadPreviewInfo,
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
  // The channel's name, else the name of whoever started the thread, as the default header shows.
  const { displayTitle } = useThreadPreviewInfo({ channel, thread });
  const repliesText = `${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}`;

  // Others typing a reply in this thread, kept for the same hide delay as the default header after
  // they stop. Empty while typing events are disabled for the channel.
  const someoneIsTyping = useDisplayedTypingUsers(channel, thread?.id).length > 0;

  return (
    <div className='cookbook-thread-header'>
      <WorkspaceNavigationBackButton />
      <div className='cookbook-thread-header__participants'>
        {participants.map(({ user }) =>
          user ? (
            <Avatar imageUrl={user.image} key={user.id} size='sm' userName={user.name} />
          ) : null,
        )}
      </div>
      <div className='cookbook-thread-header__content'>
        <div className='cookbook-thread-header__title'>Thread</div>
        <div className='cookbook-thread-header__subtitle'>
          {someoneIsTyping ? (
            <TypingIndicatorHeader threadList />
          ) : (
            [displayTitle, repliesText].filter(Boolean).join(' · ')
          )}
        </div>
      </div>
      <WorkspaceNavigationCloseButton />
    </div>
  );
};
