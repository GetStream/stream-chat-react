import React from 'react';

import { type ChannelAvatarProps, ChannelAvatar as DefaultAvatar } from '../Avatar';
import { TypingIndicatorHeader } from '../TypingIndicator/TypingIndicatorHeader';
import { useChannelHeaderOnlineStatus } from './hooks/useChannelHeaderOnlineStatus';
import { useChannelPreviewInfo } from '../ChannelListItem/hooks/useChannelPreviewInfo';
import { useChannel, useChatContext } from '../../context';
import { WorkspaceNavigationBackButton, WorkspaceNavigationCloseButton } from '../Button';
import { useStateStore } from '../../store';

import type { ChannelConfig, ChannelStateData, EventPayload } from 'stream-chat';

const typingEventsStateSelector = ({ typingEvents }: ChannelConfig) => ({
  typingEventsEnabled: typingEvents.enabled,
});

const channelTypingSelector = ({ typing }: ChannelStateData) => ({ typing });

const ChannelHeaderSubtitle = () => {
  const channel = useChannel();
  const { typingEventsEnabled } = useStateStore(
    channel.configState,
    typingEventsStateSelector,
  );
  const { client } = useChatContext();
  const { typing } = useStateStore(channel.state, channelTypingSelector);
  const onlineStatusText = useChannelHeaderOnlineStatus();
  const typingInChannel = (
    Object.values(typing) as EventPayload<'typing.start' | 'typing.stop'>[]
  ).filter(({ parent_id, user }) => user?.id !== client.user?.id && !parent_id);
  const hasTyping = typingEventsEnabled !== false && typingInChannel.length > 0;

  if (!hasTyping && !onlineStatusText) return null;

  return (
    <div className='str-chat__channel-header__data__subtitle'>
      <span
        className='str-chat__subtitle-content-transition'
        key={hasTyping ? 'typing' : 'default'}
      >
        {hasTyping ? <TypingIndicatorHeader /> : onlineStatusText}
      </span>
    </div>
  );
};

export type ChannelHeaderProps = {
  /** Avatar component. Defaults to `ChannelAvatar`. */
  Avatar?: React.ComponentType<ChannelAvatarProps>;
  /**
   * Rendered at the end of the header, after the avatar. Defaults to
   * `WorkspaceNavigationCloseButton`; a component passed here replaces it and can render that
   * button to keep it.
   */
  EndContent?: React.ComponentType;
  /**
   * Rendered at the start of the header. Defaults to `WorkspaceNavigationBackButton`; a component
   * passed here replaces it and can render that button to keep it.
   */
  StartContent?: React.ComponentType;
  /** Overrides the channel image. */
  image?: string;
  /** Overrides the channel title. */
  title?: string;
};

/** Header of the bound channel: avatar, title, and online status or typing indicator. */
export const ChannelHeader = (props: ChannelHeaderProps) => {
  const {
    Avatar = DefaultAvatar,
    EndContent = WorkspaceNavigationCloseButton,
    image: overrideImage,
    StartContent = WorkspaceNavigationBackButton,
    title: overrideTitle,
  } = props;

  const channel = useChannel();
  const { displayImage, displayTitle, groupChannelDisplayInfo } = useChannelPreviewInfo({
    channel,
    overrideImage,
    overrideTitle,
  });

  return (
    <div className='str-chat__channel-header'>
      <div className='str-chat__channel-header__start'>
        <StartContent />
      </div>
      <div className='str-chat__channel-header__data'>
        <div className='str-chat__channel-header__data__title'>{displayTitle}</div>
        <ChannelHeaderSubtitle />
      </div>
      <div className='str-chat__channel-header__end'>
        <Avatar
          className='str-chat__avatar--channel-header'
          displayMembers={groupChannelDisplayInfo?.members}
          imageUrl={displayImage}
          size='lg'
          userName={displayTitle}
        />
        <EndContent />
      </div>
    </div>
  );
};
