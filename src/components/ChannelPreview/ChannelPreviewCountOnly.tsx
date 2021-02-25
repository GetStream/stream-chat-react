import React from 'react';

import type { Channel } from 'stream-chat';

import type { ChatContextValue } from '../../context/ChatContext';

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

export type ChannelPreviewCountOnlyProps<
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
  /** Title of channel to display */
  displayTitle?: string;
  /** @see See [chat context](https://getstream.github.io/stream-chat-react/#chat) for doc */
  setActiveChannel?: ChatContextValue<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >['setActiveChannel'];
  /** Number of unread messages */
  unread?: number;
  /**
   * Object containing watcher parameters
   * @see See [Pagination documentation](https://getstream.io/chat/docs/#channel_pagination) for a list of available fields for sort.
   */
  watchers?: { limit?: number; offset?: number };
};

const UnMemoizedChannelPreviewCountOnly = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  props: ChannelPreviewCountOnlyProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { channel, displayTitle, setActiveChannel, unread, watchers } = props;

  return (
    <div className={unread && unread >= 1 ? 'unread' : ''}>
      <button
        onClick={() => {
          if (setActiveChannel) {
            setActiveChannel(channel, watchers);
          }
        }}
      >
        {' '}
        {displayTitle} <span>{unread}</span>
      </button>
    </div>
  );
};

export const ChannelPreviewCountOnly = React.memo(
  UnMemoizedChannelPreviewCountOnly,
) as typeof UnMemoizedChannelPreviewCountOnly;
