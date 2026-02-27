import React from 'react';

import { IconLayoutAlignLeft } from '../Icons/icons';
import { Avatar as DefaultAvatar } from '../Avatar';
import { useChatViewContext } from '../ChatView';
import { useChannelHeaderOnlineStatus } from './hooks/useChannelHeaderOnlineStatus';
import { useChannelPreviewInfo } from '../ChannelPreview/hooks/useChannelPreviewInfo';
import { useChannelStateContext } from '../../context/ChannelStateContext';
import { useTranslationContext } from '../../context/TranslationContext';
import { useStateStore } from '../../store';
import type { ChannelAvatarProps } from '../Avatar';
import { Button } from '../Button';
import clsx from 'clsx';

export type ChannelHeaderProps = {
  /** UI component to display an avatar, defaults to [Avatar](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Avatar/Avatar.tsx) component and accepts the same props as: [ChannelAvatar](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Avatar/ChannelAvatar.tsx) */
  Avatar?: React.ComponentType<ChannelAvatarProps>;
  /** Manually set the image to render, defaults to the Channel image */
  image?: string;
  /** UI component to display menu icon, defaults to [MenuIcon](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChannelHeader/ChannelHeader.tsx)*/
  MenuIcon?: React.ComponentType;
  /** Optional external toggle override for sidebar/entity list pane behavior */
  onSidebarToggle?: () => void;
  /** When true, shows IconLayoutAlignLeft instead of MenuIcon for sidebar expansion */
  sidebarCollapsed?: boolean;
  /** Set title manually */
  title?: string;
};

const entityListPaneOpenSelector = ({
  entityListPaneOpen,
}: {
  entityListPaneOpen: boolean;
}) => ({
  entityListPaneOpen,
});

/**
 * The ChannelHeader component renders some basic information about a Channel.
 */
export const ChannelHeader = (props: ChannelHeaderProps) => {
  const {
    Avatar = DefaultAvatar,
    image: overrideImage,
    MenuIcon = IconLayoutAlignLeft,
    onSidebarToggle,
    sidebarCollapsed: sidebarCollapsedProp,
    title: overrideTitle,
  } = props;

  const { channel } = useChannelStateContext();
  const { layoutController } = useChatViewContext();
  const { t } = useTranslationContext('ChannelHeader');
  const { displayImage, displayTitle, groupChannelDisplayInfo } = useChannelPreviewInfo({
    channel,
    overrideImage,
    overrideTitle,
  });
  const onlineStatusText = useChannelHeaderOnlineStatus();
  const { entityListPaneOpen } =
    useStateStore(layoutController.state, entityListPaneOpenSelector) ??
    entityListPaneOpenSelector(layoutController.state.getLatestValue());
  const sidebarCollapsed = sidebarCollapsedProp ?? !entityListPaneOpen;
  const handleSidebarToggle = onSidebarToggle ?? layoutController.toggleEntityListPane;

  return (
    <div
      className={clsx('str-chat__channel-header', {
        'str-chat__channel-header--sidebar-collapsed': sidebarCollapsed,
      })}
    >
      <Button
        appearance='ghost'
        aria-label={sidebarCollapsed ? t('aria/Expand sidebar') : t('aria/Menu')}
        circular
        className='str-chat__header-sidebar-toggle'
        onClick={handleSidebarToggle}
        size='md'
        variant='secondary'
      >
        {sidebarCollapsed && <MenuIcon />}
      </Button>
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
        groupChannelDisplayInfo={groupChannelDisplayInfo}
        imageUrl={displayImage}
        size='lg'
        userName={displayTitle}
      />
    </div>
  );
};
