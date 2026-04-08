import React from 'react';

import { type ChannelAvatarProps, ChannelAvatar as DefaultAvatar } from '../Avatar';
import { TypingIndicatorHeader } from '../TypingIndicator/TypingIndicatorHeader';
import { useChannelHeaderOnlineStatus } from './hooks/useChannelHeaderOnlineStatus';
import { useChannelPreviewInfo } from '../ChannelListItem/hooks/useChannelPreviewInfo';
import { useChannelStateContext } from '../../context/ChannelStateContext';
import { useChatContext } from '../../context/ChatContext';
import { useComponentContext } from '../../context/ComponentContext';
import { useTypingContext } from '../../context/TypingContext';

const ChannelHeaderSubtitle = () => {
  const { channelConfig } = useChannelStateContext('ChannelHeaderSubtitle');
  const { client } = useChatContext('ChannelHeaderSubtitle');
  const { typing = {} } = useTypingContext('ChannelHeaderSubtitle');
  const onlineStatusText = useChannelHeaderOnlineStatus();
  const typingInChannel = Object.values(typing).filter(
    ({ parent_id, user }) => user?.id !== client.user?.id && !parent_id,
  );
  const hasTyping = channelConfig?.typing_events !== false && typingInChannel.length > 0;

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
  /** UI component to display an avatar, defaults to [Avatar](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Avatar/Avatar.tsx) component and accepts the same props as: [ChannelAvatar](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Avatar/ChannelAvatar.tsx) */
  Avatar?: React.ComponentType<ChannelAvatarProps>;
  /** Manually set the image to render, defaults to the Channel image */
  image?: string;
  /** Set title manually */
  title?: string;
};

/**
 * The ChannelHeader component renders some basic information about a Channel.
 */
export const ChannelHeader = (props: ChannelHeaderProps) => {
  const { Avatar = DefaultAvatar, image: overrideImage, title: overrideTitle } = props;

  const { channel } = useChannelStateContext();
  const { HeaderStartContent } = useComponentContext();
  const { displayImage, displayTitle, groupChannelDisplayInfo } = useChannelPreviewInfo({
    channel,
    overrideImage,
    overrideTitle,
  });

  return (
    <div className='str-chat__channel-header'>
      <div className='str-chat__channel-header__start'>
        {HeaderStartContent && <HeaderStartContent />}
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
      </div>
    </div>
  );
};
