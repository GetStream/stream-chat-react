import throttle from 'lodash.throttle';
import React, { ReactNode, useEffect, useMemo, useState } from 'react';

import { ChannelPreviewMessenger } from './ChannelPreviewMessenger';
import { useIsChannelMuted } from './hooks/useIsChannelMuted';
import { useChannelPreviewInfo } from './hooks/useChannelPreviewInfo';
import { getLatestMessagePreview as defaultGetLatestMessagePreview } from './utils';

import { ChatContextValue, useChatContext } from '../../context/ChatContext';
import { useTranslationContext } from '../../context/TranslationContext';
import {
  MessageDeliveryStatus,
  useMessageDeliveryStatus,
} from './hooks/useMessageDeliveryStatus';

import type { Channel, Event } from 'stream-chat';

import type { ChannelAvatarProps } from '../Avatar/ChannelAvatar';
import type { GroupChannelDisplayInfo } from './utils';
import type { StreamMessage } from '../../context/ChannelStateContext';
import type { TranslationContextValue } from '../../context/TranslationContext';
import type { DefaultStreamChatGenerics } from '../../types/types';

export type ChannelPreviewUIComponentProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = ChannelPreviewProps<StreamChatGenerics> & {
  /** Image of Channel to display */
  displayImage?: string;
  /** Title of Channel to display */
  displayTitle?: string;
  /** Title of Channel to display */
  groupChannelDisplayInfo?: GroupChannelDisplayInfo;
  /** The last message received in a channel */
  lastMessage?: StreamMessage<StreamChatGenerics>;
  /** @deprecated Use latestMessagePreview prop instead. */
  latestMessage?: ReactNode;
  /** Latest message preview to display, will be a string or JSX element supporting markdown. */
  latestMessagePreview?: ReactNode;
  /** Status describing whether own message has been delivered or read by another. If the last message is not an own message, then the status is undefined. */
  messageDeliveryStatus?: MessageDeliveryStatus;
  /** Number of unread Messages */
  unread?: number;
};

export type ChannelPreviewProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  /** Comes from either the `channelRenderFilterFn` or `usePaginatedChannels` call from [ChannelList](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChannelList/ChannelList.tsx) */
  channel: Channel<StreamChatGenerics>;
  /** If the component's channel is the active (selected) Channel */
  active?: boolean;
  /** Current selected channel object */
  activeChannel?: Channel<StreamChatGenerics>;
  /** UI component to display an avatar, defaults to [Avatar](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Avatar/Avatar.tsx) component and accepts the same props as: [ChannelAvatar](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Avatar/ChannelAvatar.tsx) */
  Avatar?: React.ComponentType<ChannelAvatarProps<StreamChatGenerics>>;
  /** Forces the update of preview component on channel update */
  channelUpdateCount?: number;
  /** Custom class for the channel preview root */
  className?: string;
  /** Custom function that generates the message preview in ChannelPreview component */
  getLatestMessagePreview?: (
    channel: Channel<StreamChatGenerics>,
    t: TranslationContextValue['t'],
    userLanguage: TranslationContextValue['userLanguage'],
  ) => ReactNode;
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
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  props: ChannelPreviewProps<StreamChatGenerics>,
) => {
  const {
    active,
    channel,
    channelUpdateCount,
    getLatestMessagePreview = defaultGetLatestMessagePreview,
    Preview = ChannelPreviewMessenger,
  } = props;
  const {
    channel: activeChannel,
    client,
    isMessageAIGenerated,
    setActiveChannel,
  } = useChatContext<StreamChatGenerics>('ChannelPreview');
  const { t, userLanguage } = useTranslationContext('ChannelPreview');
  const { displayImage, displayTitle, groupChannelDisplayInfo } = useChannelPreviewInfo({
    channel,
  });

  const [lastMessage, setLastMessage] = useState<StreamMessage<StreamChatGenerics>>(
    channel.state.messages[channel.state.messages.length - 1],
  );
  const [latestMessagePreview, setLatestMessagePreview] = useState<ReactNode>(() =>
    getLatestMessagePreview(channel, t, userLanguage, isMessageAIGenerated),
  );

  const [unread, setUnread] = useState(0);
  const { messageDeliveryStatus } = useMessageDeliveryStatus<StreamChatGenerics>({
    channel,
    lastMessage,
  });

  const isActive =
    typeof active === 'undefined' ? activeChannel?.cid === channel.cid : active;
  const { muted } = useIsChannelMuted(channel);

  useEffect(() => {
    const handleEvent = (event: Event) => {
      if (!event.cid) return setUnread(0);
      if (channel.cid === event.cid) setUnread(0);
    };

    client.on('notification.mark_read', handleEvent);
    return () => client.off('notification.mark_read', handleEvent);
  }, [channel, client]);

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
    setLatestMessagePreview(
      getLatestMessagePreview(channel, t, userLanguage, isMessageAIGenerated),
    );

    const handleEvent = () => {
      setLastMessage(
        channel.state.latestMessages[channel.state.latestMessages.length - 1],
      );
      setLatestMessagePreview(
        getLatestMessagePreview(channel, t, userLanguage, isMessageAIGenerated),
      );
      refreshUnreadCount();
    };

    channel.on('message.new', handleEvent);
    channel.on('message.updated', handleEvent);
    channel.on('message.deleted', handleEvent);
    channel.on('message.undeleted', handleEvent);
    channel.on('channel.truncated', handleEvent);

    return () => {
      channel.off('message.new', handleEvent);
      channel.off('message.updated', handleEvent);
      channel.off('message.deleted', handleEvent);
      channel.off('message.undeleted', handleEvent);
      channel.off('channel.truncated', handleEvent);
    };
  }, [
    channel,
    client,
    refreshUnreadCount,
    channelUpdateCount,
    getLatestMessagePreview,
    t,
    userLanguage,
    isMessageAIGenerated,
  ]);

  if (!Preview) return null;

  return (
    <Preview
      {...props}
      active={isActive}
      displayImage={displayImage}
      displayTitle={displayTitle}
      groupChannelDisplayInfo={groupChannelDisplayInfo}
      lastMessage={lastMessage}
      latestMessage={latestMessagePreview}
      latestMessagePreview={latestMessagePreview}
      messageDeliveryStatus={messageDeliveryStatus}
      setActiveChannel={setActiveChannel}
      unread={unread}
    />
  );
};
