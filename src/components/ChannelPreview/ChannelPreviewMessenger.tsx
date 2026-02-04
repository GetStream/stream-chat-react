import React, { useRef } from 'react';
import clsx from 'clsx';

import { ChannelPreviewActionButtons as DefaultChannelPreviewActionButtons } from './ChannelPreviewActionButtons';
import { Avatar as DefaultAvatar } from '../Avatar';
import { useComponentContext } from '../../context';
import type { ChannelPreviewUIComponentProps } from './ChannelPreview';

const UnMemoizedChannelPreviewMessenger = (props: ChannelPreviewUIComponentProps) => {
  const {
    active,
    Avatar = DefaultAvatar,
    channel,
    className: customClassName = '',
    displayImage,
    displayTitle,
    groupChannelDisplayInfo,
    latestMessagePreview,
    onSelect: customOnSelectChannel,
    setActiveChannel,
    unread,
    watchers,
  } = props;

  const { ChannelPreviewActionButtons = DefaultChannelPreviewActionButtons } =
    useComponentContext();

  const channelPreviewButton = useRef<HTMLButtonElement | null>(null);

  const avatarName =
    displayTitle || channel.state.messages[channel.state.messages.length - 1]?.user?.id;

  const onSelectChannel = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (customOnSelectChannel) {
      customOnSelectChannel(e);
    } else if (setActiveChannel) {
      setActiveChannel(channel, watchers);
    }
    if (channelPreviewButton?.current) {
      channelPreviewButton.current.blur();
    }
  };

  return (
    <div className='str-chat__channel-preview-container'>
      <ChannelPreviewActionButtons channel={channel} />
      <button
        aria-label={`Select Channel: ${displayTitle || ''}`}
        aria-selected={active}
        className={clsx(
          `str-chat__channel-preview-messenger str-chat__channel-preview`,
          active && 'str-chat__channel-preview-messenger--active',
          unread && unread >= 1 && 'str-chat__channel-preview-messenger--unread',
          customClassName,
        )}
        data-testid='channel-preview-button'
        onClick={onSelectChannel}
        ref={channelPreviewButton}
        role='option'
      >
        <div className='str-chat__channel-preview-messenger--left'>
          <Avatar
            className='str-chat__avatar--channel-preview'
            groupChannelDisplayInfo={groupChannelDisplayInfo}
            imageUrl={displayImage}
            size='lg'
            userName={avatarName}
          />
        </div>
        <div className='str-chat__channel-preview-end'>
          <div className='str-chat__channel-preview-end-first-row'>
            <div className='str-chat__channel-preview-messenger--name'>
              <span>{displayTitle}</span>
            </div>
            {!!unread && (
              <div
                className='str-chat__channel-preview-unread-badge'
                data-testid='unread-badge'
              >
                {unread}
              </div>
            )}
          </div>
          <div className='str-chat__channel-preview-messenger--last-message'>
            {latestMessagePreview}
          </div>
        </div>
      </button>
    </div>
  );
};

/**
 * Used as preview component for channel item in [ChannelList](#channellist) component.
 * Its best suited for messenger type chat.
 */
export const ChannelPreviewMessenger = React.memo(
  UnMemoizedChannelPreviewMessenger,
) as typeof UnMemoizedChannelPreviewMessenger;
