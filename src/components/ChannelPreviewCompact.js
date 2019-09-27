import React from 'react';
import { Avatar } from './Avatar';
import PropTypes from 'prop-types';

/**
 *
 * @example ./docs/ChannelPreviewCompact.md
 * @extends PureComponent
 *
 */
export class ChannelPreviewCompact extends React.PureComponent {
  static propTypes = {
    /** **Available from [chat context](https://getstream.github.io/stream-chat-react/#chat)** */
    setActiveChannel: PropTypes.func,
    /** **Available from [chat context](https://getstream.github.io/stream-chat-react/#chat)** */
    channel: PropTypes.object,
    closeMenu: PropTypes.func,
    unread_count: PropTypes.number,
    /** If channel of component is active (selected) channel */
    active: PropTypes.bool,
    latestMessage: PropTypes.string,
  };

  channelPreviewButton = React.createRef();

  onSelectChannel = () => {
    this.props.setActiveChannel(this.props.channel, this.props.watchers);
    this.channelPreviewButton.current.blur();
  };
  render() {
    const unreadClass =
      this.props.unread_count >= 1
        ? 'str-chat__channel-preview-compact--unread'
        : '';
    const activeClass = this.props.active
      ? 'str-chat__channel-preview-compact--active'
      : '';
    const name = this.props.channel.data.name || this.props.channel.cid;
    return (
      <button
        onClick={this.onSelectChannel}
        ref={this.channelPreviewButton}
        className={`str-chat__channel-preview-compact ${unreadClass} ${activeClass}`}
      >
        <div className="str-chat__channel-preview-compact--left">
          <Avatar image={this.props.channel.data.image} size={20} />
        </div>
        <div className="str-chat__channel-preview-compact--right">{name}</div>
      </button>
    );
  }
}
