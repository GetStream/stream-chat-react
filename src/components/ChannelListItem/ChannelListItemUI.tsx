import React, { useMemo, useRef } from 'react';
import clsx from 'clsx';

import { ChannelListItemActionButtons as DefaultChannelListItemActionButtons } from './ChannelListItemActionButtons';
import { ChannelListItemTimestamp } from './ChannelListItemTimestamp';

import { ChannelAvatar as DefaultChannelAvatar } from '../Avatar';
import { Badge } from '../Badge';
import { IconMute as DefaultIconMute, IconPin as DefaultIconPin } from '../Icons';
import { useInteractionAnnouncements } from '../Accessibility';
import {
  useChatContext,
  useComponentContext,
  useTranslationContext,
} from '../../context';
import type { ChannelListItemUIProps } from './ChannelListItem';
import { composeChannelListItemAccessibleLabel } from './utils.a11y';
import { SummarizedMessagePreview } from '../SummarizedMessagePreview';

const UnMemoizedChannelListItemUI = (props: ChannelListItemUIProps) => {
  const {
    accessibleLabelConfig,
    active,
    channel,
    className: customClassName = '',
    displayImage,
    displayTitle,
    groupChannelDisplayInfo,
    lastMessage,
    messageDeliveryStatus,
    muted,
    onSelect: customOnSelectChannel,
    pinned,
    setActiveChannel,
    unread,
    watchers,
  } = props;

  const {
    Avatar = DefaultChannelAvatar,
    ChannelListItemActionButtons = DefaultChannelListItemActionButtons,
    icons: { IconMute = DefaultIconMute, IconPin = DefaultIconPin } = {},
  } = useComponentContext();
  const { client, isMessageAIGenerated } = useChatContext('ChannelListItemUI');
  const { t, tDateTimeParser, userLanguage } = useTranslationContext('ChannelListItemUI');
  const { announceInteraction } = useInteractionAnnouncements();

  const channelPreviewButton = useRef<HTMLButtonElement | null>(null);

  // Composed accessible name for the row. Built here (the overridable presentation component) so a
  // `ComponentContext`-supplied `ChannelListItemUI` can configure it via `accessibleLabelConfig`.
  const accessibleLabel = useMemo(
    () =>
      composeChannelListItemAccessibleLabel(
        {
          active,
          channel,
          client,
          displayTitle,
          isMessageAIGenerated,
          latestMessage: lastMessage,
          messageDeliveryStatus,
          t,
          tDateTimeParser,
          unreadCount: unread,
          userLanguage,
        },
        accessibleLabelConfig,
      ),
    // `muted`/`pinned` are intentional recompute triggers: the parts read
    // `channel.state` / channel mute & membership state (which ESLint can't see and which do not
    // themselves trigger a re-render), so we key on the state ChannelListItem already tracks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      accessibleLabelConfig,
      active,
      channel,
      client,
      displayTitle,
      isMessageAIGenerated,
      lastMessage,
      messageDeliveryStatus,
      muted,
      pinned,
      t,
      tDateTimeParser,
      unread,
      userLanguage,
    ],
  );

  const avatarName =
    displayTitle || channel.state.messages[channel.state.messages.length - 1]?.user?.id;

  const onSelectChannel = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (customOnSelectChannel) {
      customOnSelectChannel(e);
    } else if (setActiveChannel) {
      setActiveChannel(channel, watchers);
      // Confirm the opened channel to assistive tech. Only when actually switching (not re-selecting
      // the open one) and only via the default selection path — a custom `onSelect` owns its own
      // feedback. Debounced in the registry so it lands after the composer's focus announcement.
      if (!active && displayTitle) {
        announceInteraction('channel.opened', { name: displayTitle });
      }
    }
    if (channelPreviewButton?.current) {
      channelPreviewButton.current.blur();
    }
  };

  return (
    <div className='str-chat__channel-list-item-container'>
      <button
        aria-label={accessibleLabel}
        // Single-select list: set aria-selected only on the active row. Setting it (false) on every
        // other row makes screen readers announce "not selected" on each one — noise.
        aria-selected={active || undefined}
        className={clsx(
          'str-chat__channel-list-item',
          {
            'str-chat__channel-list-item--muted': muted,
            'str-chat__channel-list-item--pinned': pinned,
            'str-chat__channel-list-item--unread':
              typeof unread === 'number' && unread > 0,
          },
          customClassName,
        )}
        data-testid='channel-list-item-button'
        onClick={onSelectChannel}
        ref={channelPreviewButton}
        role='option'
      >
        <Avatar
          aria-hidden='true'
          displayMembers={groupChannelDisplayInfo?.members}
          imageUrl={displayImage}
          size='xl'
          userName={avatarName}
        />
        <div className='str-chat__channel-list-item-data'>
          <div className='str-chat__channel-list-item-data__first-row'>
            <div className='str-chat__channel-list-item-data__title'>
              <span>{displayTitle || 'N/A'}</span>
              {pinned && <IconPin />}
              {muted && <IconMute />}
            </div>
            <div className='str-chat__channel-list-item-data__timestamp-and-badge'>
              <ChannelListItemTimestamp lastMessage={lastMessage} />
              {typeof unread === 'number' && unread > 0 && (
                <Badge data-testid='unread-badge' size='md' variant='primary'>
                  {unread}
                </Badge>
              )}
            </div>
          </div>
          <SummarizedMessagePreview
            latestMessage={lastMessage}
            messageDeliveryStatus={messageDeliveryStatus}
            participantCount={channel.data?.member_count}
          />
        </div>
      </button>
      <ChannelListItemActionButtons />
    </div>
  );
};

/**
 * Used as preview component for channel item in [ChannelList](#channellist) component.
 * Its best suited for messenger type chat.
 */
export const ChannelListItemUI = React.memo(
  UnMemoizedChannelListItemUI,
) as typeof UnMemoizedChannelListItemUI;
