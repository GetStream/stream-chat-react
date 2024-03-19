import throttle from 'lodash.throttle';
import React, { useEffect, useMemo, useState } from 'react';

import { ChannelPreviewMessenger } from './ChannelPreviewMessenger';
import { useIsChannelMuted } from './hooks/useIsChannelMuted';
import { useChannelPreviewInfo } from './hooks/useChannelPreviewInfo';
import { getLatestMessagePreview } from './utils';

import { ChatContextValue, useChatContext } from '../../context/ChatContext';
import { useTranslationContext } from '../../context/TranslationContext';
import { MessageDeliveryStatus, useMessageDeliveryStatus } from './hooks/useMessageDeliveryStatus';

import type { Channel, Event } from 'stream-chat';

import type { AvatarProps } from '../Avatar/Avatar';

import type { StreamMessage } from '../../context/ChannelStateContext';

import type { DefaultStreamChatGenerics } from '../../types/types';

export type ChannelPreviewUIComponentProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = ChannelPreviewProps<StreamChatGenerics> & {
  /** If the component's channel is the active (selected) Channel */
  active?: boolean;
  /** Image of Channel to display */
  displayImage?: string;
  /** Title of Channel to display */
  displayTitle?: string;
  /** The last message received in a channel */
  lastMessage?: StreamMessage<StreamChatGenerics>;
  /** Latest message preview to display, will be a string or JSX element supporting markdown. */
  latestMessage?: string | JSX.Element;
  /** Status describing whether own message has been delivered or read by another. If the last message is not an own message, then the status is undefined. */
  messageDeliveryStatus?: MessageDeliveryStatus;
  /** Number of unread Messages */
  unread?: number;
};

export type ChannelPreviewProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  /** Comes from either the `channelRenderFilterFn` or `usePaginatedChannels` call from [ChannelList](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChannelList/ChannelList.tsx) */
  channel: Channel<StreamChatGenerics>;
  /** Current selected channel object */
  activeChannel?: Channel<StreamChatGenerics>;
  /** Custom UI component to display user avatar, defaults to and accepts same props as: [Avatar](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Avatar/Avatar.tsx) */
  Avatar?: React.ComponentType<AvatarProps>;
  /** Forces the update of preview component on channel update */
  channelUpdateCount?: number;
  /** Custom class for the channel preview root */
  className?: string;
  key?: string;
  /** Custom ChannelPreview click handler function */
  onSelect?: (event: React.MouseEvent) => void;
  /** Custom UI component to display the channel preview in the list, defaults to and accepts same props as: [ChannelPreviewMessenger](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChannelPreview/ChannelPreviewMessenger.tsx) */
  Preview?: React.ComponentType<ChannelPreviewUIComponentProps<StreamChatGenerics>>;
  /** Setter for selected Channel */
  setActiveChannel?: ChatContextValue<StreamChatGenerics>['setActiveChannel'];
  /** Object containing watcher parameters */
  watchers?: { limit?: number; offset?: number };
};

export const ChannelPreview = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  props: ChannelPreviewProps<StreamChatGenerics>,
) => {
  const { channel, Preview = ChannelPreviewMessenger, channelUpdateCount } = props;
  const { channel: activeChannel, client, setActiveChannel } = useChatContext<StreamChatGenerics>(
    'ChannelPreview',
  );
  const { t, userLanguage } = useTranslationContext('ChannelPreview');
  const { displayImage, displayTitle } = useChannelPreviewInfo({ channel });

  const [lastMessage, setLastMessage] = useState<StreamMessage<StreamChatGenerics>>(
    channel.state.messages[channel.state.messages.length - 1],
  );
  const [unread, setUnread] = useState(0);
  const { messageDeliveryStatus } = useMessageDeliveryStatus<StreamChatGenerics>({
    channel,
    lastMessage,
  });

  const isActive = activeChannel?.cid === channel.cid;
  const { muted } = useIsChannelMuted(channel);

  useEffect(() => {
    const handleEvent = (event: Event) => {
      if (!event.cid) return setUnread(0);
      if (channel.cid === event.cid) setUnread(0);
    };

    client.on('notification.mark_read', handleEvent);
    return () => client.off('notification.mark_read', handleEvent);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleEvent = (event: Event) => {
      if (channel.cid !== event.cid) return;
      if (event.user?.id !== client.user?.id) return;
      setUnread(channel.countUnread());
    };
    channel.on('notification.mark_unread', handleEvent);
    return () => {
      channel.off('notification.mark_unread', handleEvent);
    };
  }, [channel, client]);

  const refreshUnreadCount = useMemo(
    () =>
      throttle(() => {
        if (muted) {
          setUnread(0);
        } else {
          setUnread(channel.countUnread());
        }
      }, 400),
    [channel, muted],
  );

  useEffect(() => {
    refreshUnreadCount();

    const handleEvent = (event: Event<StreamChatGenerics>) => {
      if (event.message) setLastMessage(event.message);
      refreshUnreadCount();
    };

    channel.on('message.new', handleEvent);
    channel.on('message.updated', handleEvent);
    channel.on('message.deleted', handleEvent);

    return () => {
      channel.off('message.new', handleEvent);
      channel.off('message.updated', handleEvent);
      channel.off('message.deleted', handleEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshUnreadCount, channelUpdateCount]);

  if (!Preview) return null;

  const latestMessage = getLatestMessagePreview(channel, t, userLanguage);

  return (
    <Preview
      {...props}
      active={isActive}
      displayImage={displayImage}
      displayTitle={displayTitle}
      lastMessage={lastMessage}
      latestMessage={latestMessage}
      messageDeliveryStatus={messageDeliveryStatus}
      setActiveChannel={setActiveChannel}
      unread={unread}
    />
  );
};
