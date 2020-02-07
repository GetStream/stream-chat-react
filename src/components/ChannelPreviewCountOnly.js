import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

export class ChannelPreviewCountOnly extends PureComponent {
  static propTypes = {
    /** **Available from [chat context](https://getstream.github.io/stream-chat-react/#chat)** */
    channel: PropTypes.object.isRequired,
    /** Current selected channel object */
    activeChannel: PropTypes.object.isRequired,
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

  render() {
    const unreadClass = this.props.unread >= 1 ? 'unread' : '';
    const name = this.props.channel.data.name || this.props.channel.cid;

    return (
      <div className={unreadClass}>
        <button
          onClick={this.props.setActiveChannel.bind(this, this.props.channel)}
        >
          {' '}
          {name} <span>{this.props.unread}</span>
        </button>
      </div>
    );
  }
}
