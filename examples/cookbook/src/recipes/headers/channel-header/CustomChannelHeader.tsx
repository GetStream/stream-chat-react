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

const channelStateSelector = ({ memberCount, members, typing }: ChannelStateData) => ({
  memberCount,
  members,
  typing,
});

const typingEventsSelector = ({ typingEvents }: ChannelConfig) => ({
  typingEventsEnabled: typingEvents.enabled,
});

export const CustomChannelHeader = () => {
  const { client } = useChatContext();
  const channel = useChannel();
  const { memberCount, members, typing } = useStateStore(
    channel.state,
    channelStateSelector,
  );
  // Members whose user is online anywhere, as the default header counts them.
  const onlineCount = Object.values(members).filter(
    (member) => member.user?.online,
  ).length;
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
            `${memberCount} members · ${onlineCount} online`
          )}
        </div>
      </div>
      <WorkspaceNavigationCloseButton />
    </div>
  );
};
