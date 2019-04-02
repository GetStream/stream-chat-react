import React, { PureComponent } from 'react';

export class ChannelPreviewCountOnly extends PureComponent {
  render() {
    const unreadClass = this.props.unread_count >= 1 ? 'unread' : '';
    const name = this.props.channel.data.name || this.props.channel.cid;

    return (
      <div className={unreadClass}>
        <button
          onClick={this.props.setActiveChannel.bind(this, this.props.channel)}
        >
          {' '}
          {name} <span>{this.props.unread_count}</span>
        </button>
      </div>
    );
  }
}
