import React, { PureComponent } from 'react';
import { Avatar } from './Avatar';

import truncate from 'lodash/truncate';

export class ChannelPreviewMessenger extends PureComponent {
  channelPreviewButton = React.createRef();

  onSelectChannel = () => {
    this.props.setActiveChannel(this.props.channel);
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
    const name = this.props.channel.data.name || this.props.channel.cid;
    return (
      <button
        onClick={this.onSelectChannel}
        ref={this.channelPreviewButton}
        className={`str-chat__channel-preview-messenger ${unreadClass} ${activeClass}`}
      >
        <div className="str-chat__channel-preview-messenger--left">
          {true && <Avatar source={this.props.channel.data.image} size={40} />}
        </div>
        <div className="str-chat__channel-preview-messenger--right">
          <div className="str-chat__channel-preview-messenger--name">
            {name}
          </div>
          <div className="str-chat__channel-preview-messenger--last-message">
            {!this.props.channel.state.messages[0]
              ? 'Nothing yet...'
              : truncate(
                  this.props.channel.state.messages[
                    this.props.channel.state.messages.length - 1
                  ].text,
                  14,
                )}
          </div>
        </div>
      </button>
    );
  }
}
