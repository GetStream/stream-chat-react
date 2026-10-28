import type { ChannelConfig, ChannelStateData, EventPayload } from 'stream-chat';
import {
  ChannelAvatar,
  TypingIndicatorHeader,
  useChannel,
  useChannelPreviewInfo,
  useChatContext,
  useStateStore,
  WorkspaceNavigationBackButton,
  WorkspaceNavigationCloseButton,
} from 'stream-chat-react';
import './CustomChannelHeader.css';

const channelStateSelector = ({
  memberCount,
  typing,
  watcherCount,
}: ChannelStateData) => ({
  memberCount,
  typing,
  watcherCount,
});

const typingEventsSelector = ({ typingEvents }: ChannelConfig) => ({
  typingEventsEnabled: typingEvents.enabled,
});

export const CustomChannelHeader = () => {
  const { client } = useChatContext();
  const channel = useChannel();
  const { memberCount, typing, watcherCount } = useStateStore(
    channel.state,
    channelStateSelector,
  );
  const { typingEventsEnabled } = useStateStore(
    channel.configState,
    typingEventsSelector,
  );
  const { displayImage, displayTitle, groupChannelDisplayInfo } = useChannelPreviewInfo({
    channel,
  });

  // Others typing in the channel itself; replies typed in threads carry a parent_id.
  const someoneIsTyping = (Object.values(typing) as EventPayload<'typing.start'>[]).some(
    ({ parent_id, user }) => !parent_id && user?.id !== client.userId,
  );

  return (
    <div className='cookbook-channel-header'>
      <WorkspaceNavigationBackButton />
      <ChannelAvatar
        displayMembers={groupChannelDisplayInfo.members}
        imageUrl={displayImage}
        size='lg'
        userName={displayTitle}
      />
      <div className='cookbook-channel-header__content'>
        <div className='cookbook-channel-header__title'>{displayTitle}</div>
        <div className='cookbook-channel-header__subtitle'>
          {typingEventsEnabled && someoneIsTyping ? (
            <TypingIndicatorHeader />
          ) : (
            `${memberCount} members · ${watcherCount} online`
          )}
        </div>
      </div>
      <WorkspaceNavigationCloseButton />
    </div>
  );
};
