import React from 'react';

import { IconChevronLeft, IconLayoutAlignLeft } from '../Icons/icons';
import { Avatar as DefaultAvatar } from '../Avatar';
import { getChatViewEntityBinding, useChatViewContext } from '../ChatView';
import { useChatViewNavigation } from '../ChatView/ChatViewNavigationContext';
import { useChannelHeaderOnlineStatus } from './hooks/useChannelHeaderOnlineStatus';
import { useChannelPreviewInfo } from '../ChannelPreview/hooks/useChannelPreviewInfo';
import { useChannel, useTranslationContext } from '../../context';
import { useStateStore } from '../../store';
import type { ChannelAvatarProps } from '../Avatar';
import type { ChatViewLayoutState } from '../ChatView/layoutController/layoutControllerTypes';
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

const channelHeaderLayoutSelector = ({
  activeSlot,
  entityListPaneOpen,
  slotBindings,
  slotHistory,
  visibleSlots,
}: ChatViewLayoutState) => ({
  activeSlot,
  entityListPaneOpen,
  slotBindings,
  slotHistory,
  visibleSlots,
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

  const channel = useChannel();
  const { layoutController } = useChatViewContext();
  const { hideChannelList, unhideChannelList } = useChatViewNavigation();
  const { t } = useTranslationContext('ChannelHeader');
  const { displayImage, displayTitle, groupChannelDisplayInfo } = useChannelPreviewInfo({
    channel,
    overrideImage,
    overrideTitle,
  });
  const onlineStatusText = useChannelHeaderOnlineStatus();
  const { activeSlot, entityListPaneOpen, slotBindings, slotHistory, visibleSlots } =
    useStateStore(layoutController.state, channelHeaderLayoutSelector) ??
    channelHeaderLayoutSelector(layoutController.state.getLatestValue());
  const channelListSlot = visibleSlots.find(
    (slot) => getChatViewEntityBinding(slotBindings[slot])?.kind === 'channelList',
  );
  const hasParentHistory = !!(activeSlot && slotHistory?.[activeSlot]?.length);
  const sidebarCollapsed = sidebarCollapsedProp ?? !entityListPaneOpen;
  const handleSidebarToggle =
    onSidebarToggle ??
    (() => {
      if (entityListPaneOpen) {
        hideChannelList({ slot: channelListSlot });
        return;
      }

      unhideChannelList({ slot: channelListSlot ?? activeSlot });
    });
  const handleHeaderAction = hasParentHistory
    ? () => {
        if (!activeSlot) return;
        layoutController.close(activeSlot);
      }
    : handleSidebarToggle;
  const actionAriaLabel = hasParentHistory
    ? t('aria/Go back')
    : sidebarCollapsed
      ? t('aria/Expand sidebar')
      : t('aria/Menu');

  return (
    <div
      className={clsx('str-chat__channel-header', {
        'str-chat__channel-header--sidebar-collapsed': sidebarCollapsed,
      })}
    >
      <Button
        appearance='ghost'
        aria-label={actionAriaLabel}
        circular
        className='str-chat__header-sidebar-toggle'
        onClick={handleHeaderAction}
        size='md'
        variant='secondary'
      >
        {hasParentHistory ? <IconChevronLeft /> : sidebarCollapsed && <MenuIcon />}
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
