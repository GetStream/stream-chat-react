import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Avatar } from './Avatar';
import { withChannelContext } from '../context';

/**
 * ChannelHeader - Render some basic information about this channel
 *
 * @example ./docs/ChannelHeader.md
 * @extends PureComponent
 */
class ChannelHeader extends PureComponent {
  static propTypes = {
    /** Set title manually */
    title: PropTypes.string,
    /** Show a little indicator that the channel is live right now */
    live: PropTypes.bool,
    /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#chat)** */
    channel: PropTypes.object.isRequired,
    /** **Available from [channel context](https://getstream.github.io/stream-chat-react/#chat)** */
    watcher_count: PropTypes.number,
  };

  render() {
    return (
      <div className="str-chat__header-livestream">
        {this.props.channel.data.image && (
          <Avatar
            image={this.props.channel.data.image}
            shape="rounded"
            size={this.props.channel.type === 'commerce' ? 60 : 40}
          />
        )}
        <div className="str-chat__header-livestream-left">
          <p className="str-chat__header-livestream-left--title">
            {this.props.title || this.props.channel.data.name}{' '}
            {this.props.live && (
              <span className="str-chat__header-livestream-left--livelabel">
                live
              </span>
            )}
          </p>
          {this.props.channel.data.subtitle && (
            <p className="str-chat__header-livestream-left--subtitle">
              {this.props.channel.data.subtitle}
            </p>
          )}
          <p className="str-chat__header-livestream-left--members">
            {!this.props.live && this.props.channel.data.member_count > 0 && (
              <>{this.props.channel.data.member_count} members, </>
            )}
            {this.props.watcher_count} online
          </p>
        </div>
        <div className="str-chat__header-livestream-right">
          <div className="str-chat__header-livestream-right-button-wrapper">
            <a
              href="https://getstream.io/chat/"
              target="_blank"
              rel="noopener noreferrer"
              className="str-chat__square-button str-chat__header-livestream-right-button--info"
            >
              <svg width="4" height="14" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M3 13h1v.5H0V13h1V5.5H0V5h3v8zM1.994 3.516A1.507 1.507 0 1 1 1.995.502a1.507 1.507 0 0 1-.001 3.014z"
                  fillRule="evenodd"
                />
              </svg>
            </a>
          </div>
        </div>
      </div>
    );
  }
}

ChannelHeader = withChannelContext(ChannelHeader);
export { ChannelHeader };
