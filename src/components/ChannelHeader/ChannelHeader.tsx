import React from 'react';

import { IconLayoutAlignLeft } from '../Icons/icons';
import { type ChannelAvatarProps, ChannelAvatar as DefaultAvatar } from '../Avatar';
import { useChannelHeaderOnlineStatus } from './hooks/useChannelHeaderOnlineStatus';
import { useChannelPreviewInfo } from '../ChannelPreview/hooks/useChannelPreviewInfo';
import { useChannelStateContext } from '../../context/ChannelStateContext';
import { useChatContext } from '../../context/ChatContext';
import clsx from 'clsx';
import { ToggleSidebarButton } from '../Button/ToggleSidebarButton';

export type ChannelHeaderProps = {
  /** UI component to display an avatar, defaults to [Avatar](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Avatar/Avatar.tsx) component and accepts the same props as: [ChannelAvatar](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Avatar/ChannelAvatar.tsx) */
  Avatar?: React.ComponentType<ChannelAvatarProps>;
  /** Manually set the image to render, defaults to the Channel image */
  image?: string;
  /** UI component to display menu icon, defaults to IconLayoutAlignLeft*/
  MenuIcon?: React.ComponentType;
  /** Set title manually */
  title?: string;
};

/**
 * The ChannelHeader component renders some basic information about a Channel.
 */
export const ChannelHeader = (props: ChannelHeaderProps) => {
  const {
    Avatar = DefaultAvatar,
    image: overrideImage,
    MenuIcon = IconLayoutAlignLeft,
    title: overrideTitle,
  } = props;

  const { channel } = useChannelStateContext();
  const { navOpen } = useChatContext();
  const { displayImage, displayTitle, groupChannelDisplayInfo } = useChannelPreviewInfo({
    channel,
    overrideImage,
    overrideTitle,
  });
  const onlineStatusText = useChannelHeaderOnlineStatus();

  return (
    <div
      className={clsx('str-chat__channel-header', {
        'str-chat__channel-header--sidebar-collapsed': !navOpen,
      })}
    >
      <ToggleSidebarButton mode='expand'>
        <MenuIcon />
      </ToggleSidebarButton>
      <div className='str-chat__channel-header__data'>
        <div className='str-chat__channel-header__data__title'>{displayTitle}</div>
        {onlineStatusText != null && (
          <div className='str-chat__channel-header__data__subtitle'>
            {onlineStatusText}
          </div>
        )}
      </div>
      <Avatar
        className='str-chat__avatar--channel-header'
        displayMembers={groupChannelDisplayInfo?.members}
        imageUrl={displayImage}
        overflowCount={groupChannelDisplayInfo?.overflowCount}
        size='lg'
        userName={displayTitle}
      />
    </div>
  );
};
