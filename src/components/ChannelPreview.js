import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';

export const ChannelPreview = ({
  Preview,
  setActiveChannel,
  watchers,
  channel,
  activeChannel,
}) => {
  const [unread, setUnread] = useState(0);
  const [lastRead, setLastRead] = useState(new Date());
  const [latestMessage, setLatestMessage] = useState('');
  const [lastMessage, setLastMessage] = useState({});

  useEffect(() => {
    const handleEvent = () => {
      setLastMessage(event.message);
      if (!isActive()) {
        const unread = channel.countUnread(lastRead);
        setUnread(unread);
      } else {
        setUnread(0);
      }
    };

    channel.on('message.new', handleEvent);
    return () => {
      channel.off('message.new', handleEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    // listen to change...
    if (isActive()) {
      setLastRead(new Date());
    }

    const unread = channel.countUnread(lastRead);
    setLatestMessage(getPreviewLatestMessage(channel));
    setUnread(unread);
  }, [channel, activeChannel, isActive, lastRead]);

  const isActive = useCallback(() => activeChannel.cid === channel.cid, [
    activeChannel,
    channel,
  ]);

  return (
    <Preview
      lastMessage={lastMessage}
      channel={channel}
      unread={unread}
      latestMessage={latestMessage}
      activeChannel={activeChannel}
      active={activeChannel.cid === channel.cid}
      setActiveChannel={setActiveChannel}
      watchers={watchers}
    />
  );
};

export const getPreviewLatestMessage = (channel) => {
  const latestMessage =
    channel.state.messages[channel.state.messages.length - 1];

  if (!latestMessage) {
    return 'Nothing yet...';
  }
  if (latestMessage.deleted_at) {
    return 'Message deleted';
  }
  if (latestMessage.text) {
    return latestMessage.text;
  } else {
    if (latestMessage.command) {
      return '/' + latestMessage.command;
    }
    if (latestMessage.attachments.length) {
      return '🏙 Attachment...';
    }
    return 'Empty message...';
  }
};

ChannelPreview.propTypes = {
  /** **Available from [chat context](https://getstream.github.io/stream-chat-react/#chat)** */
  channel: PropTypes.object.isRequired,
  /** Current selected channel object */
  activeChannel: PropTypes.object.isRequired,
  /** Setter for selected channel */
  setActiveChannel: PropTypes.func.isRequired,
  /**
   * Available built-in options (also accepts the same props as):
   *
   * 1. [ChannelPreviewCompact](https://getstream.github.io/stream-chat-react/#ChannelPreviewCompact) (default)
   * 2. [ChannelPreviewLastMessage](https://getstream.github.io/stream-chat-react/#ChannelPreviewLastMessage)
   * 3. [ChannelPreviewMessanger](https://getstream.github.io/stream-chat-react/#ChannelPreviewMessanger)
   *
   * The Preview to use, defaults to ChannelPreviewLastMessage
   * */
  Preview: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  /**
   * Object containing watcher parameters
   * @see See [Pagination documentation](https://getstream.io/chat/docs/#channel_pagination) for a list of available fields for sort.
   * */
  watchers: PropTypes.object,
};
