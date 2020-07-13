import React from 'react';
import PropTypes from 'prop-types';

/** @type {React.FC<import('types').ChannelPreviewUIComponentProps>} */
const ChannelPreviewCountOnly = ({
  channel,
  setActiveChannel,
  watchers,
  unread,
  displayTitle,
}) => {
  return (
    <div className={unread >= 1 ? 'unread' : ''}>
      <button onClick={() => setActiveChannel(channel, watchers)}>
        {' '}
        {displayTitle} <span>{unread}</span>
      </button>
    </div>
  );
};

ChannelPreviewCountOnly.propTypes = {
  /** **Available from [chat context](https://getstream.github.io/stream-chat-react/#chat)** */
  channel: PropTypes.object.isRequired,
  /** @see See [chat context](https://getstream.github.io/stream-chat-react/#chat) for doc */
  setActiveChannel: PropTypes.func.isRequired,
  /**
   * Object containing watcher parameters
   * @see See [Pagination documentation](https://getstream.io/chat/docs/#channel_pagination) for a list of available fields for sort.
   * */
  watchers: /** @type {PropTypes.Validator<{ limit?: number | undefined; offset?: number | undefined} | null | undefined> | undefined} */ (PropTypes.object),
  /** Number of unread messages */
  unread: PropTypes.number,
  /** Title of channel to display */
  displayTitle: PropTypes.string,
};

export default React.memo(ChannelPreviewCountOnly);
