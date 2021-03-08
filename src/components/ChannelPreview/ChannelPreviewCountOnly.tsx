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
} from '../../../types/types';

export type ChannelPreviewCountOnlyProps<
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
  /** Title of channel to display */
  displayTitle?: string;
  /** @see See [ChatContext](https://getstream.github.io/stream-chat-react/#chat) for doc */
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
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
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
