import type { ChannelStateData } from 'stream-chat';
import {
  ChannelAvatar,
  TypingIndicatorHeader,
  useChannel,
  useChannelPreviewInfo,
  useDisplayedTypingUsers,
  useStateStore,
  WorkspaceNavigationBackButton,
  WorkspaceNavigationCloseButton,
} from 'stream-chat-react';
import './CustomChannelHeader.css';

const channelStateSelector = ({ memberCount, watcherCount }: ChannelStateData) => ({
  memberCount,
  watcherCount,
});

export const CustomChannelHeader = () => {
  const channel = useChannel();
  const { memberCount, watcherCount } = useStateStore(
    channel.state,
    channelStateSelector,
  );
  const { displayImage, displayTitle, groupChannelDisplayInfo } = useChannelPreviewInfo({
    channel,
  });

  // Others typing in the channel itself, kept for the same hide delay as the default header after
  // they stop. Empty while typing events are disabled for the channel.
  const someoneIsTyping = useDisplayedTypingUsers(channel).length > 0;

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
          {someoneIsTyping ? (
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
