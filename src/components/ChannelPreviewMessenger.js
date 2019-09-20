import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import { Avatar } from './Avatar';

import truncate from 'lodash/truncate';

/**
 * Used as preview component for channel item in [ChannelList](#channellist) component.
 * Its best suited for messenger type chat.
 *
 * @example ./docs/ChannelPreviewMessenger.md
 * @extends PureComponent
 */
export class ChannelPreviewMessenger extends PureComponent {
  static propTypes = {
    /** **Available from [chat context](https://getstream.github.io/stream-chat-react/#chat)** */
    setActiveChannel: PropTypes.func,
    /** **Available from [chat context](https://getstream.github.io/stream-chat-react/#chat)** */
    channel: PropTypes.object,
    closeMenu: PropTypes.func,
    unread: PropTypes.number,
    /** If channel of component is active (selected) channel */
    active: PropTypes.bool,
    latestMessage: PropTypes.string,
  };

  channelPreviewButton = React.createRef();

  onSelectChannel = () => {
    this.props.setActiveChannel(this.props.channel, this.props.watchers);
    this.channelPreviewButton.current.blur();
    this.props.closeMenu();
  };
  render() {
    const unreadClass =
      this.props.unread >= 1
        ? 'str-chat__channel-preview-messenger--unread'
        : '';
    const activeClass = this.props.active
      ? 'str-chat__channel-preview-messenger--active'
      : '';

    const { channel } = this.props;

    return (
      <button
        onClick={this.onSelectChannel}
        ref={this.channelPreviewButton}
        className={`str-chat__channel-preview-messenger ${unreadClass} ${activeClass}`}
      >
        <div className="str-chat__channel-preview-messenger--left">
          {<Avatar image={channel.data.image} size={40} />}
        </div>
        <div className="str-chat__channel-preview-messenger--right">
          <div className="str-chat__channel-preview-messenger--name">
            <span>{channel.data.name}</span>
          </div>
          <div className="str-chat__channel-preview-messenger--last-message">
            {!channel.state.messages[0]
              ? 'Nothing yet...'
              : truncate(this.props.latestMessage, 14)}
          </div>
        </div>
      </button>
    );
  }
}
