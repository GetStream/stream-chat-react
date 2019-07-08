import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { LoadingChannels } from './LoadingChannels';
import { ChatDown } from './ChatDown';
import { withChatContext } from '../context';

/**
 * ChannelList - A preview list of channels, allowing you to select the channel you want to open
 * @example ./examples/ChannelList.md
 */
class ChannelListMessenger extends PureComponent {
  static propTypes = {
    /** The loading indicator to use */
    LoadingIndicator: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
    error: PropTypes.bool,
  };

  static defaultProps = {
    LoadingIndicator: LoadingChannels,
  };

  render() {
    if (this.props.error) {
      return <ChatDown type="Connection Error" />;
    } else if (this.props.loading) {
      return <LoadingChannels />;
    } else {
      return (
        <div className="str-chat__channel-list-messenger">
          <div className="str-chat__channel-list-messenger__main">
            {this.props.children}
          </div>
        </div>
      );
    }
  }
}

ChannelListMessenger = withChatContext(ChannelListMessenger);
export { ChannelListMessenger };
