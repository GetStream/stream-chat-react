import React, { useMemo, useRef } from 'react';
import clsx from 'clsx';

import { ChannelListItemActionButtons as DefaultChannelListItemActionButtons } from './ChannelListItemActionButtons';
import { ChannelListItemTimestamp } from './ChannelListItemTimestamp';

import { ChannelAvatar as DefaultChannelAvatar } from '../Avatar';
import { Badge } from '../Badge';
import { useInteractionAnnouncements } from '../Accessibility';
import {
  useChatContext,
  useComponentContext,
  useComponentContextIcons,
  useTranslationContext,
  useWorkspaceNavigation,
} from '../../context';
import type { ChannelListItemUIProps } from './ChannelListItem';
import { composeChannelListItemAccessibleLabel } from './utils.a11y';
import { SummarizedMessagePreview as DefaultSummarizedMessagePreview } from '../SummarizedMessagePreview';

const UnMemoizedChannelListItemUI = (props: ChannelListItemUIProps) => {
  const { IconMute, IconPin } = useComponentContextIcons();
  const {
    accessibleLabelConfig,
    active,
    channel,
    className: customClassName = '',
    displayImage,
    displayTitle,
    groupChannelDisplayInfo,
    messageDeliveryStatus,
    muted,
    onSelect: customOnSelectChannel,
    pinned,
    previewedMessage,
    unread,
  } = props;

  const {
    Avatar = DefaultChannelAvatar,
    ChannelListItemActionButtons = DefaultChannelListItemActionButtons,
    SummarizedMessagePreview = DefaultSummarizedMessagePreview,
  } = useComponentContext();
  const { client, isMessageAIGenerated } = useChatContext();
  const { t, tDateTimeParser, userLanguage } = useTranslationContext();
  const { openChannel } = useWorkspaceNavigation();
  const { announceInteraction } = useInteractionAnnouncements();

  const channelPreviewButton = useRef<HTMLButtonElement | null>(null);

  // Built here, in the overridable component, so a custom `ChannelListItemUI` can configure it via
  // `accessibleLabelConfig`.
  const accessibleLabel = useMemo(
    () =>
      composeChannelListItemAccessibleLabel(
        {
          active,
          channel,
          client,
          displayTitle,
          isMessageAIGenerated,
          latestMessage: previewedMessage,
          messageDeliveryStatus,
          t,
          tDateTimeParser,
          unreadCount: unread,
          userLanguage,
        },
        accessibleLabelConfig,
      ),
    // `muted` and `pinned` are recompute triggers: the label parts read channel mute and membership
    // state, which ESLint cannot see and which do not re-render this component by themselves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      accessibleLabelConfig,
      active,
      channel,
      client,
      displayTitle,
      isMessageAIGenerated,
      messageDeliveryStatus,
      muted,
      pinned,
      previewedMessage,
      t,
      tDateTimeParser,
      unread,
      userLanguage,
    ],
  );

  const avatarName = displayTitle || channel.messagePaginator.headmostItem?.user?.id;

  const onSelectChannel = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (customOnSelectChannel) {
      customOnSelectChannel(e);
    } else {
      // Forwards the event so an overridden `openChannel` (e.g. via `deriveWorkspaceNavigation`)
      // can honor ⌘/ctrl-click.
      openChannel(channel, { event: e });
      // Announced only when switching channels via the default path; a custom `onSelect` owns its
      // own feedback. Debounced so it lands after the composer's focus announcement.
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
        // Set only on the active row: `false` on every other row makes screen readers announce "not
        // selected" on each one.
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
              <ChannelListItemTimestamp previewedMessage={previewedMessage} />
              {typeof unread === 'number' && unread > 0 && (
                <Badge data-testid='unread-badge' size='md' variant='primary'>
                  {unread}
                </Badge>
              )}
            </div>
          </div>
          <SummarizedMessagePreview
            latestMessage={previewedMessage}
            messageDeliveryStatus={messageDeliveryStatus}
            participantCount={channel.data?.member_count}
          />
        </div>
      </button>
      <ChannelListItemActionButtons />
    </div>
  );
};

/** Default row UI of `ChannelListItem`: avatar, title, timestamp, unread badge and preview. */
export const ChannelListItemUI = React.memo(
  UnMemoizedChannelListItemUI,
) as typeof UnMemoizedChannelListItemUI;
