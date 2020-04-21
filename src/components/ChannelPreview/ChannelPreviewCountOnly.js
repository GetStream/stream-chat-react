import React from 'react';
import PropTypes from 'prop-types';

const ChannelPreviewCountOnly = ({ channel, setActiveChannel, unread }) => {
  const unreadClass = unread >= 1 ? 'unread' : '';
  const name = channel.data.name || channel.cid;

  return (
    <div className={unreadClass}>
      <button onClick={() => setActiveChannel(channel)}>
        {' '}
        {name} <span>{unread}</span>
      </button>
    </div>
  );
};

ChannelPreviewCountOnly.propTypes = {
  /** **Available from [chat context](https://getstream.github.io/stream-chat-react/#chat)** */
  channel: PropTypes.object.isRequired,
  /** Current selected channel object */
  activeChannel: PropTypes.object,
  /** @see See [chat context](https://getstream.github.io/stream-chat-react/#chat) for doc */
  setActiveChannel: PropTypes.func.isRequired,
  /**
   * Object containing watcher parameters
   * @see See [Pagination documentation](https://getstream.io/chat/docs/#channel_pagination) for a list of available fields for sort.
   * */
  watchers: PropTypes.object,
  /** Number of unread messages */
  unread: PropTypes.number,
};

export default React.memo(ChannelPreviewCountOnly);
