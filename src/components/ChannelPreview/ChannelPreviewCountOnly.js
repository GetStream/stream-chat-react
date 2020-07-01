import React from 'react';
import PropTypes from 'prop-types';

const ChannelPreviewCountOnly = ({
  channel,
  setActiveChannel,
  unread,
  displayTitle,
}) => {
  return (
    <div className={unread >= 1 ? 'unread' : ''}>
      <button onClick={() => setActiveChannel(channel)}>
        {' '}
        {displayTitle} <span>{unread}</span>
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
  /** Title of channel to display */
  displayTitle: PropTypes.string,
  /** Image of channel to display */
  displayImage: PropTypes.string,
};

export default React.memo(ChannelPreviewCountOnly);
