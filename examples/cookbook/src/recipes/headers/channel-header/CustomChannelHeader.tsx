import type { ChannelStateData } from 'stream-chat';
import {
  ChannelAvatar,
  TypingIndicatorHeader,
  useChannel,
  useChannelPreviewInfo,
  useComponentContextIcons,
  useDisplayedTypingUsers,
  useStateStore,
  WorkspaceNavigationBackButton,
  WorkspaceNavigationCloseButton,
} from 'stream-chat-react';
import './CustomChannelHeader.css';

const channelStateSelector = ({ memberCount, members, watchers }: ChannelStateData) => ({
  memberCount,
  members,
  watchers,
});

export const CustomChannelHeader = () => {
  const channel = useChannel();
  const { memberCount, members, watchers } = useStateStore(
    channel.state,
    channelStateSelector,
  );
  // Members who are online or watch the channel, as the default header counts them.
  const onlineCount = Object.values(members).filter(
    (member) =>
      member.user?.online ||
      (member.user?.id && Object.prototype.hasOwnProperty.call(watchers, member.user.id)),
  ).length;
  const { IconUsers } = useComponentContextIcons();
  const {
    avatarName,
    displayImage,
    displayTitle,
    groupChannelDisplayInfo,
    isGroupChannel,
  } = useChannelPreviewInfo({ channel });

  // Others typing in the channel itself, kept for the same hide delay as the default header after
  // they stop. Empty while typing events are disabled for the channel.
  const someoneIsTyping = useDisplayedTypingUsers(channel).length > 0;

  return (
    <div className='cookbook-channel-header'>
      <WorkspaceNavigationBackButton />
      <ChannelAvatar
        displayMembers={groupChannelDisplayInfo.members}
        FallbackIcon={isGroupChannel ? IconUsers : undefined}
        imageUrl={displayImage}
        size='lg'
        userName={avatarName}
      />
      <div className='cookbook-channel-header__content'>
        <div className='cookbook-channel-header__title'>{displayTitle}</div>
        <div className='cookbook-channel-header__subtitle'>
          {someoneIsTyping ? (
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
