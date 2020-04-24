import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

export class ChannelPreviewCountOnly extends PureComponent {
  static propTypes = {
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

  render() {
    const { displayTitle } = this.props;
    const unreadClass = this.props.unread >= 1 ? 'unread' : '';

    return (
      <div className={unreadClass}>
        <button
          onClick={this.props.setActiveChannel.bind(this, this.props.channel)}
        >
          {' '}
          {displayTitle} <span>{this.props.unread}</span>
        </button>
      </div>
    );
  }
}
