// @ts-check
import React, { useState, useEffect, useContext } from 'react';

// eslint-disable-next-line import/no-unresolved
import PropTypes from 'prop-types';
import ChannelPreviewCountOnly from './ChannelPreviewCountOnly';
import { TranslationContext, ChatContext } from '../../context';
import {
  getLatestMessagePreview,
  getDisplayTitle,
  getDisplayImage,
} from './utils';

/**
 * @type {React.FC<import('types').ChannelPreviewProps>}
 */
const ChannelPreview = (props) => {
  const { t } = useContext(TranslationContext);
  const { client, channel: activeChannel, setActiveChannel } = useContext(
    ChatContext,
  );
  const { channel, Preview = ChannelPreviewCountOnly } = props;
  const [lastMessage, setLastMessage] = useState(
    /** @type {import('stream-chat').MessageResponse | undefined} */ (undefined),
  );
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    setUnread(channel.countUnread());
  }, [channel]);

  useEffect(() => {
    /** @type {(event: StreamChat.Event) => void} Typescript syntax */
    const handleEvent = (event) => {
      const isActive = activeChannel?.cid === channel.cid;
      setLastMessage(event.message);

      if (!isActive) {
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
  }, [channel, activeChannel]);

  useEffect(() => {
    const isActive = activeChannel?.cid === channel.cid;

    if (isActive) {
      setUnread(0);
    } else {
      setUnread(channel.countUnread());
    }
  }, [activeChannel, channel]);

  if (!Preview) {
    return null;
  }

  return (
    <Preview
      {...props}
      setActiveChannel={setActiveChannel}
      lastMessage={lastMessage}
      unread={unread}
      latestMessage={getLatestMessagePreview(channel, t)}
      displayTitle={getDisplayTitle(channel, client.user)}
      displayImage={getDisplayImage(channel, client.user)}
      active={activeChannel && activeChannel.cid === channel.cid}
    />
  );
};

ChannelPreview.propTypes = {
  /** **Available from [chat context](https://getstream.github.io/stream-chat-react/#chat)** */
  channel: /** @type {PropTypes.Validator<import('stream-chat').Channel>} */ (PropTypes
    .object.isRequired),
  /** Current selected channel object */
  activeChannel: /** @type {PropTypes.Validator<import('stream-chat').Channel | null | undefined>} */ (PropTypes.object),
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
