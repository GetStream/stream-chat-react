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
    /** When true, loading indicator is shown - [LoadingChannels](https://github.com/GetStream/stream-chat-react/blob/master/src/components/LoadingChannels.js) */
    loading: PropTypes.bool,
    /** When true, error indicator is shown - [ChatDown](https://github.com/GetStream/stream-chat-react/blob/master/src/components/ChatDown.js) */
    error: PropTypes.bool,
  };

  static defaultProps = {
    error: false,
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
