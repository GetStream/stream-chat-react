import type {
  ChannelConfig,
  ChannelStateData,
  EventPayload,
  ThreadState,
} from 'stream-chat';
import {
  Avatar,
  TypingIndicatorHeader,
  useChannel,
  useChannelPreviewInfo,
  useChatContext,
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
const typingSelector = ({ typing }: ChannelStateData) => ({ typing });
const typingEventsSelector = ({ typingEvents }: ChannelConfig) => ({
  typingEventsEnabled: typingEvents.enabled,
});

export const CustomThreadHeader = () => {
  const { client } = useChatContext();
  const channel = useChannel();
  const thread = useThreadContext();
  const { participants = [], replyCount = 0 } =
    useStateStore(thread?.state, threadStateSelector) ?? {};
  const { typing } = useStateStore(channel.state, typingSelector);
  const { typingEventsEnabled } = useStateStore(
    channel.configState,
    typingEventsSelector,
  );
  const { displayTitle } = useChannelPreviewInfo({ channel });

  // Others typing a reply in this thread. Typing events carry the thread's id as parent_id.
  const someoneIsTyping = (Object.values(typing) as EventPayload<'typing.start'>[]).some(
    ({ parent_id, user }) => parent_id === thread?.id && user?.id !== client.userId,
  );

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
          {typingEventsEnabled && someoneIsTyping ? (
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
