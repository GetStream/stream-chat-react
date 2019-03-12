import React from 'react';
import { Avatar } from './Avatar';

export class ChannelPreviewCompact extends React.PureComponent {
  channelPreviewButton = React.createRef();

  onSelectChannel = () => {
    this.props.setActiveChannel(this.props.channel);
    this.channelPreviewButton.current.blur();
  };
  render() {
    const unreadClass =
      this.props.unread >= 1 ? 'str-chat__channel-preview-compact--unread' : '';
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
          {true && <Avatar image={this.props.channel.data.image} size={20} />}
        </div>
        <div className="str-chat__channel-preview-compact--right">{name}</div>
      </button>
    );
  }
}
