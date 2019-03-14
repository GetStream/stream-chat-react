import React, { PureComponent } from 'react';
import { Avatar } from './Avatar';

export class ChannelPreviewLastMessage extends PureComponent {
  channelPreviewButton = React.createRef();

  onSelectChannel = () => {
    this.props.setActiveChannel(this.props.channel);
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
                : this.props.latestMessage}
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
