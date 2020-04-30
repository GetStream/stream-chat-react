/* eslint-disable */
import React from 'react';
import PropTypes from 'prop-types';

import { Avatar } from '../Avatar';

/**
 *
 * @example ../../docs/ChannelPreviewCompact.md
 * @extends PureComponent
 *
 */
class ChannelPreviewCompact extends React.PureComponent {
  static propTypes = {
    /** **Available from [chat context](https://getstream.github.io/stream-chat-react/#chat)** */
    channel: PropTypes.object.isRequired,
    /** Current selected channel object */
    activeChannel: PropTypes.object,
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
    /** Title of channel to display */
    displayTitle: PropTypes.string,
    /** Image of channel to display */
    displayImage: PropTypes.string,
  };

  channelPreviewButton = React.createRef();

  onSelectChannel = () => {
    this.props.setActiveChannel(this.props.channel, this.props.watchers);
    this.channelPreviewButton.current.blur();
  };
  render() {
    const { displayTitle, displayImage } = this.props;
    const unreadClass =
      this.props.unread_count >= 1
        ? 'str-chat__channel-preview-compact--unread'
        : '';
    const activeClass = this.props.active
      ? 'str-chat__channel-preview-compact--active'
      : '';

    return (
      <button
        onClick={this.onSelectChannel}
        ref={this.channelPreviewButton}
        className={`str-chat__channel-preview-compact ${unreadClass} ${activeClass}`}
      >
        <div className="str-chat__channel-preview-compact--left">
          <Avatar image={displayImage} size={20} />
        </div>
        <div className="str-chat__channel-preview-compact--right">
          {displayTitle}
        </div>
      </button>
    );
  }
}

export default ChannelPreviewCompact;
