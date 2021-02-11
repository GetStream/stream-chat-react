// @ts-check
import React, { useContext, useEffect, useState } from 'react';

import PropTypes from 'prop-types';
import ChannelPreviewCountOnly from './ChannelPreviewCountOnly';
import { ChatContext, TranslationContext } from '../../context';
import {
  getDisplayImage,
  getDisplayTitle,
  getLatestMessagePreview,
} from './utils';

/**
 * @type {React.FC<import('types').ChannelPreviewProps>}
 */
const ChannelPreview = (props) => {
  const { channel, Preview = ChannelPreviewCountOnly } = props;

  const { channel: activeChannel, client, setActiveChannel } = useContext(
    ChatContext,
  );
  const { t } = useContext(TranslationContext);

  const [lastMessage, setLastMessage] = useState(
    /** @type {import('stream-chat').MessageResponse | undefined} */ (undefined),
  );
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
    /** @type {(event: import('stream-chat').Event) => void} */
    const handleEvent = (event) => {
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

ChannelPreview.propTypes = {
  /** Current selected channel object */
  activeChannel: /** @type {PropTypes.Validator<import('stream-chat').Channel | null | undefined>} */ (PropTypes.object),
  /**
   * Custom UI component to display user avatar
   *
   * Defaults to and accepts same props as: [Avatar](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Avatar/Avatar.js)
   * */
  Avatar: /** @type {PropTypes.Validator<React.ElementType<import('types').AvatarProps>>} */ (PropTypes.elementType),
  /** **Available from [chat context](https://getstream.github.io/stream-chat-react/#chat)** */
  channel: /** @type {PropTypes.Validator<import('stream-chat').Channel>} */ (PropTypes
    .object.isRequired),
  /**
   * Available built-in options (also accepts the same props as):
   *
   * 1. [ChannelPreviewCompact](https://getstream.github.io/stream-chat-react/#ChannelPreviewCompact) (default)
   * 2. [ChannelPreviewLastMessage](https://getstream.github.io/stream-chat-react/#ChannelPreviewLastMessage)
   * 3. [ChannelPreviewMessanger](https://getstream.github.io/stream-chat-react/#ChannelPreviewMessanger)
   *
   * The Preview to use, defaults to ChannelPreviewLastMessage
   * */
  Preview: /** @type {PropTypes.Validator<React.ComponentType<import('types').ChannelPreviewUIComponentProps>>} */ (PropTypes.elementType),
};

export default ChannelPreview;
