import React from 'react';

import { IconChevronLeft, IconLayoutAlignLeft } from '../Icons/icons';
import { Avatar as DefaultAvatar } from '../Avatar';
import { getChatViewEntityBinding, useChatViewContext } from '../ChatView';
import { useLayoutViewState } from '../ChatView/hooks/useLayoutViewState';
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
  /** Optional external toggle override for the list-slot sidebar behavior */
  onSidebarToggle?: () => void;
  /** When true, shows IconLayoutAlignLeft instead of MenuIcon for sidebar expansion */
  sidebarCollapsed?: boolean;
  /** Set title manually */
  title?: string;
};

const channelHeaderLayoutSelector = (state: ChatViewLayoutState) => ({
  activeView: state.activeView,
  listSlotByView: state.listSlotByView,
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
  const { activeView, listSlotByView } =
    useStateStore(layoutController.state, channelHeaderLayoutSelector) ??
    channelHeaderLayoutSelector(layoutController.state.getLatestValue());
  const { availableSlots, hiddenSlots, slotBindings, slotHistory } = useLayoutViewState();
  const listSlotHint = listSlotByView?.[activeView];
  const channelListSlot =
    (listSlotHint && availableSlots.includes(listSlotHint) ? listSlotHint : undefined) ??
    availableSlots.find(
      (slot) => getChatViewEntityBinding(slotBindings[slot])?.kind === 'channelList',
    );
  const backCandidateSlots = availableSlots.filter(
    (slot) => !!slotHistory?.[slot]?.length,
  );
  const backTargetSlot =
    backCandidateSlots.length === 1 ? backCandidateSlots[0] : undefined;
  const hasParentHistory = !!backTargetSlot;
  const listVisible = channelListSlot ? !hiddenSlots?.[channelListSlot] : true;
  const sidebarCollapsed = sidebarCollapsedProp ?? !listVisible;
  const handleSidebarToggle =
    onSidebarToggle ??
    (() => {
      if (listVisible) {
        hideChannelList({ slot: channelListSlot });
        return;
      }

      const deterministicFallbackSlot =
        availableSlots.length === 1 ? availableSlots[0] : undefined;
      unhideChannelList({ slot: channelListSlot ?? deterministicFallbackSlot });
    });
  const handleGoBack = () => {
    if (!backTargetSlot) return;
    layoutController.goBack(backTargetSlot);
  };

  const shouldUseBackAction = listVisible && hasParentHistory;
  const shouldShowToggleOrBackButton = shouldUseBackAction || !listVisible;
  const handleHeaderAction = shouldUseBackAction ? handleGoBack : handleSidebarToggle;
  const actionAriaLabel = shouldUseBackAction
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
      {shouldShowToggleOrBackButton && (
        <Button
          appearance='ghost'
          aria-label={actionAriaLabel}
          circular
          className='str-chat__header-sidebar-toggle'
          onClick={handleHeaderAction}
          size='md'
          variant='secondary'
        >
          {shouldUseBackAction ? <IconChevronLeft /> : <MenuIcon />}
        </Button>
      )}
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
