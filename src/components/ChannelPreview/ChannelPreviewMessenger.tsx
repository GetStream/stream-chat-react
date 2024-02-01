import React, { useEffect, useRef } from 'react';
import clsx from 'clsx';

import { Avatar as DefaultAvatar } from '../Avatar';
import { useChatContext } from '../../context';

import type { Event } from 'stream-chat';
import type { ChannelPreviewUIComponentProps } from './ChannelPreview';

import type { DefaultStreamChatGenerics } from '../../types/types';

const UnMemoizedChannelPreviewMessenger = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  props: ChannelPreviewUIComponentProps<StreamChatGenerics>,
) => {
  const {
    active,
    activeChannel,
    Avatar = DefaultAvatar,
    channel,
    className: customClassName = '',
    displayImage,
    displayTitle,
    latestMessage,
    markActiveChannelReadOnLeave,
    markActiveChannelReadOnReenter = true,
    onSelect: customOnSelectChannel,
    setActiveChannel,
    unread,
    watchers,
  } = props;

  const { client } = useChatContext<StreamChatGenerics>('ChannelPreviewMessenger');
  const channelPreviewButton = useRef<HTMLButtonElement | null>(null);
  const avatarName =
    displayTitle || channel.state.messages[channel.state.messages.length - 1]?.user?.id;

  const previouslyClicked = useRef(active);

  const handleMarkReadOnReenter = () => {
    if (!client.user) return;
    const ownReadState = channel.state.read[client.user.id];
    if (!previouslyClicked.current) {
      previouslyClicked.current = true;
    } else if (
      !active &&
      (ownReadState?.first_unread_message_id || ownReadState?.unread_messages > 0) &&
      previouslyClicked.current
    ) {
      channel.markRead();
    }
  };

  const handleMarkReadOnLeave = () => {
    if (!(client.user && activeChannel)) return;
    const ownReadState = activeChannel.state.read[client.user.id];
    if (ownReadState?.first_unread_message_id || ownReadState?.unread_messages > 0) {
      activeChannel.markRead();
    }
  };

  const onSelectChannel = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (customOnSelectChannel) {
      customOnSelectChannel(e);
    } else if (setActiveChannel) {
      if (markActiveChannelReadOnReenter) {
        handleMarkReadOnReenter();
      } else if (markActiveChannelReadOnLeave) {
        handleMarkReadOnLeave();
      }
      setActiveChannel(channel, watchers);
    }
    if (channelPreviewButton?.current) {
      channelPreviewButton.current.blur();
    }
  };

  useEffect(() => {
    if (markActiveChannelReadOnLeave) return;
    const handleEvent = (event: Event) => {
      if (active) return;
      if (channel.cid !== event.cid) return;
      if (event.type === 'notification.mark_unread' && event.user?.id !== client.user?.id) return;
      previouslyClicked.current = false;
    };
    channel.on('notification.mark_unread', handleEvent);
    channel.on('message.new', handleEvent);
    return () => {
      channel.off('notification.mark_unread', handleEvent);
      channel.off('message.new', handleEvent);
    };
  }, [active, channel, client, markActiveChannelReadOnLeave, previouslyClicked]);

  return (
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
        <Avatar image={displayImage} name={avatarName} size={40} />
      </div>
      <div className='str-chat__channel-preview-messenger--right str-chat__channel-preview-end'>
        <div className='str-chat__channel-preview-end-first-row'>
          <div className='str-chat__channel-preview-messenger--name'>
            <span>{displayTitle}</span>
          </div>
          {!!unread && (
            <div className='str-chat__channel-preview-unread-badge' data-testid='unread-badge'>
              {unread}
            </div>
          )}
        </div>
        <div className='str-chat__channel-preview-messenger--last-message'>{latestMessage}</div>
      </div>
    </button>
  );
};

/**
 * Used as preview component for channel item in [ChannelList](#channellist) component.
 * Its best suited for messenger type chat.
 */
export const ChannelPreviewMessenger = React.memo(
  UnMemoizedChannelPreviewMessenger,
) as typeof UnMemoizedChannelPreviewMessenger;
