import React, { useEffect, useState } from 'react';

import { ChannelPreviewMessenger } from './ChannelPreviewMessenger';
import { useIsChannelMuted } from './hooks/useIsChannelMuted';
import { getDisplayImage, getDisplayTitle, getLatestMessagePreview } from './utils';

import { ChatContextValue, useChatContext } from '../../context/ChatContext';
import { useTranslationContext } from '../../context/TranslationContext';

import type { Channel, Event } from 'stream-chat';

import type { AvatarProps } from '../Avatar/Avatar';

import type { StreamMessage } from '../../context/ChannelStateContext';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../types/types';

export type ChannelPreviewUIComponentProps<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = ChannelPreviewProps<At, Ch, Co, Ev, Me, Re, Us> & {
  /** If the component's channel is the active (selected) Channel */
  active?: boolean;
  /** Image of Channel to display */
  displayImage?: string;
  /** Title of Channel to display */
  displayTitle?: string;
  /** The last message received in a channel */
  lastMessage?: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>;
  /** Latest message preview to display, will be a string or JSX element supporting markdown. */
  latestMessage?: string | JSX.Element;
  /** Number of unread Messages */
  unread?: number;
};

export type ChannelPreviewProps<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = {
  /** Comes from either the `channelRenderFilterFn` or `usePaginatedChannels` call from [ChannelList](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChannelList/ChannelList.tsx) */
  channel: Channel<At, Ch, Co, Ev, Me, Re, Us>;
  /** Current selected channel object */
  activeChannel?: Channel<At, Ch, Co, Ev, Me, Re, Us>;
  /** Custom UI component to display user avatar, defaults to and accepts same props as: [Avatar](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Avatar/Avatar.tsx) */
  Avatar?: React.ComponentType<AvatarProps>;
  /** Forces the update of preview component on channel update */
  channelUpdateCount?: number;
  key?: string;
  /** Custom UI component to display the channel preview in the list, defaults to and accepts same props as: [ChannelPreviewMessenger](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChannelPreview/ChannelPreviewMessenger.tsx) */
  Preview?: React.ComponentType<ChannelPreviewUIComponentProps<At, Ch, Co, Ev, Me, Re, Us>>;
  /** Setter for selected Channel */
  setActiveChannel?: ChatContextValue<At, Ch, Co, Ev, Me, Re, Us>['setActiveChannel'];
  /** Object containing watcher parameters */
  watchers?: { limit?: number; offset?: number };
};

export const ChannelPreview = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  props: ChannelPreviewProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { channel, Preview = ChannelPreviewMessenger } = props;

  const { channel: activeChannel, client, setActiveChannel } = useChatContext<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >('ChannelPreview');
  const { t, userLanguage } = useTranslationContext('ChannelPreview');

  const [lastMessage, setLastMessage] = useState<StreamMessage<At, Ch, Co, Ev, Me, Re, Us>>(
    channel.state.messages[channel.state.messages.length - 1],
  );
  const [unread, setUnread] = useState(0);

  const isActive = activeChannel?.cid === channel.cid;
  const { muted } = useIsChannelMuted(channel);

  useEffect(() => {
    const handleEvent = (event: Event) => {
      if (!event.cid) return setUnread(0);
      if (channel.cid === event.cid) setUnread(0);
    };

    client.on('notification.mark_read', handleEvent);
    return () => client.off('notification.mark_read', handleEvent);
  }, []);

  useEffect(() => {
    if (isActive || muted) {
      setUnread(0);
    } else {
      setUnread(channel.countUnread());
    }
  }, [channel, isActive, muted]);

  useEffect(() => {
    const handleEvent = (event: Event<At, Ch, Co, Ev, Me, Re, Us>) => {
      if (event.message) setLastMessage(event.message);

      if (!isActive && !muted) {
        setUnread(channel.countUnread());
      } else {
        setUnread(0);
      }
    };

    channel.on('message.new', handleEvent);
    channel.on('message.updated', handleEvent);
    channel.on('message.deleted', handleEvent);

    return () => {
      channel.off('message.new', handleEvent);
      channel.off('message.updated', handleEvent);
      channel.off('message.deleted', handleEvent);
    };
  }, [channel, isActive, muted]);

  if (!Preview) return null;

  const displayImage = getDisplayImage(channel, client.user);
  const displayTitle = getDisplayTitle(channel, client.user);
  const latestMessage = getLatestMessagePreview(channel, t, userLanguage);

  return (
    <Preview
      {...props}
      active={isActive}
      displayImage={displayImage}
      displayTitle={displayTitle}
      lastMessage={lastMessage}
      latestMessage={latestMessage}
      setActiveChannel={setActiveChannel}
      unread={unread}
    />
  );
};
