import React, { useEffect, useState } from 'react';

import {
  ChannelPreviewCountOnly,
  ChannelPreviewCountOnlyProps,
} from './ChannelPreviewCountOnly';
import {
  getDisplayImage,
  getDisplayTitle,
  getLatestMessagePreview,
} from './utils';

import { ChatContextValue, useChatContext } from '../../context/ChatContext';
import { useTranslationContext } from '../../context/TranslationContext';

import type { Channel, Event, MessageResponse } from 'stream-chat';

import type { ChannelPreviewCompactProps } from './ChannelPreviewCompact';
import type { ChannelPreviewMessengerProps } from './ChannelPreviewMessenger';

import type { AvatarProps } from '../Avatar/Avatar';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../../types/types';

export type ChannelPreviewUIComponentProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> =
  | ChannelPreviewCompactProps<At, Ch, Co, Ev, Me, Re, Us>
  | ChannelPreviewCountOnlyProps<At, Ch, Co, Ev, Me, Re, Us>
  | ChannelPreviewMessengerProps<At, Ch, Co, Ev, Me, Re, Us>
  | {
      channel: Channel<At, Ch, Co, Ev, Me, Re, Us>;
      lastMessage?: MessageResponse<At, Ch, Co, Me, Re, Us>;
    };

export type ChannelPreviewProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
> = {
  /** Comes from either the `channelRenderFilterFn` or `usePaginatedChannels` call from [ChannelList](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChannelList/ChannelList.tsx) */
  channel: Channel<At, Ch, Co, Ev, Me, Re, Us>;
  /** Current selected channel object */
  activeChannel?: Channel<At, Ch, Co, Ev, Me, Re, Us>;
  Avatar?: React.ComponentType<AvatarProps>;
  channelUpdateCount?: number;
  // Prop to trigger a re-render of the preview component after connection is recovered.
  connectionRecoveredCount?: number;
  key?: string;
  /**
   * Available built-in options (also accepts the same props as):
   *
   * 1. [ChannelPreviewCompact](https://getstream.github.io/stream-chat-react/#ChannelPreviewCompact) (default)
   * 2. [ChannelPreviewLastMessage](https://getstream.github.io/stream-chat-react/#ChannelPreviewLastMessage)
   * 3. [ChannelPreviewMessenger](https://getstream.github.io/stream-chat-react/#ChannelPreviewMessanger)
   *
   * The Preview to use, defaults to ChannelPreviewLastMessage
   * */
  Preview?: React.ComponentType<
    ChannelPreviewUIComponentProps<At, Ch, Co, Ev, Me, Re, Us>
  >;
  setActiveChannel?: ChatContextValue<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >['setActiveChannel'];
};

export const ChannelPreview = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: ChannelPreviewProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { channel, Preview = ChannelPreviewCountOnly } = props;

  const { channel: activeChannel, client, setActiveChannel } = useChatContext<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >();
  const { t } = useTranslationContext();

  const [lastMessage, setLastMessage] = useState<
    MessageResponse<At, Ch, Co, Me, Re, Us>
  >();
  const [unread, setUnread] = useState(0);

  const isActive = activeChannel?.cid === channel.cid;
  const { muted } = channel.muteStatus();

  useEffect(() => {
    if (isActive || muted) {
      setUnread(0);
    } else {
      setUnread(channel.countUnread());
    }
  }, [channel, isActive, muted]);

  useEffect(() => {
    const handleEvent = (event: Event<At, Ch, Co, Ev, Me, Re, Us>) => {
      setLastMessage(event.message);

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

  return (
    <Preview
      {...props}
      active={isActive}
      displayImage={getDisplayImage(channel, client.user)}
      displayTitle={getDisplayTitle(channel, client.user)}
      lastMessage={lastMessage}
      latestMessage={getLatestMessagePreview(channel, t)}
      setActiveChannel={setActiveChannel}
      unread={unread}
    />
  );
};
