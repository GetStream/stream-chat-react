import React, { PureComponent } from 'react';
import { Avatar } from './Avatar';
import PropTypes from 'prop-types';
import truncate from 'lodash/truncate';

/**
 * Used as preview component for channel item in [ChannelList](#channellist) component.
 *
 * @example ./docs/ChannelPreviewLastMessage.md
 * @extends PureComponent
 */

export class ChannelPreviewLastMessage extends PureComponent {
  static propTypes = {
    /** **Available from [chat context](https://getstream.github.io/stream-chat-react/#chat)** */
    channel: PropTypes.object.isRequired,
    /** Current selected channel object */
    activeChannel: PropTypes.object.isRequired,
    /** Setter for selected channel */
    setActiveChannel: PropTypes.func.isRequired,
    /**
     * Object containing watcher parameters
     * @see See [Pagination documentation](https://getstream.io/chat/docs/#channel_pagination) for a list of available fields for sort.
     * */
    watchers: PropTypes.object,
    /** Number of unread messages */
    unread: PropTypes.number,
    /** If channel of component is active (selected) channel */
    active: PropTypes.bool,
    /** Latest message's text. */
    latestMessage: PropTypes.string,
    /** Length of latest message to truncate at */
    latestMessageLength: PropTypes.number,
  };

  static defaultProps = {
    latestMessageLength: 20,
  };

  channelPreviewButton = React.createRef();

  onSelectChannel = () => {
    this.props.setActiveChannel(this.props.channel, this.props.watchers);
    this.channelPreviewButton.current.blur();
  };

  render() {
    const unreadClass =
      this.props.unread >= 1 ? 'str-chat__channel-preview--unread' : '';
    const activeClass = this.props.active
      ? 'str-chat__channel-preview--active'
      : '';
    const name = this.props.channel.data.name || this.props.channel.cid;
    return (
      <div
        className={`str-chat__channel-preview ${unreadClass} ${activeClass}`}
      >
        <button onClick={this.onSelectChannel} ref={this.channelPreviewButton}>
          {this.props.unread >= 1 && (
            <div className="str-chat__channel-preview--dot" />
          )}
          <Avatar image={this.props.channel.data.image} />
          <div className="str-chat__channel-preview-info">
            <span className="str-chat__channel-preview-title">{name}</span>
            <span className="str-chat__channel-preview-last-message">
              {!this.props.channel.state.messages[0]
                ? 'Nothing yet...'
                : truncate(this.props.latestMessage, {
                    length: this.props.latestMessageLength,
                  })}
            </span>
            {this.props.unread >= 1 && (
              <span className="str-chat__channel-preview-unread-count">
                {this.props.unread}
              </span>
            )}
          </div>
        </button>
      </div>
    );
  }
}
