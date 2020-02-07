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
    /** Text to display in place of latest message, when channel has no messages yet. */
    emptyMessageText: PropTypes.string,
  };

  static defaultProps = {
    latestMessageLength: 20,
    emptyMessageText: 'Nothing yet...',
  };

  channelPreviewButton = React.createRef();

  onSelectChannel = () => {
    this.props.setActiveChannel(this.props.channel, this.props.watchers);
    this.channelPreviewButton.current.blur();
  };

  render() {
    const {
      channel,
      emptyMessageText,
      latestMessage,
      latestMessageLength,
      unread_count,
      active,
    } = this.props;

    const unreadClass =
      unread_count >= 1 ? 'str-chat__channel-preview--unread' : '';
    const activeClass = active ? 'str-chat__channel-preview--active' : '';
    const name = channel.data.name || channel.cid;

    return (
      <div
        className={`str-chat__channel-preview ${unreadClass} ${activeClass}`}
      >
        <button onClick={this.onSelectChannel} ref={this.channelPreviewButton}>
          {unread_count >= 1 && (
            <div className="str-chat__channel-preview--dot" />
          )}
          <Avatar image={channel.data.image} />
          <div className="str-chat__channel-preview-info">
            <span className="str-chat__channel-preview-title">{name}</span>
            <span className="str-chat__channel-preview-last-message">
              {!latestMessage
                ? emptyMessageText
                : truncate(latestMessage, {
                    length: latestMessageLength,
                  })}
            </span>
            {unread_count >= 1 && (
              <span className="str-chat__channel-preview-unread-count">
                {unread_count}
              </span>
            )}
          </div>
        </button>
      </div>
    );
  }
}
