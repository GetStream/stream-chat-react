import React, { PureComponent } from 'react';
import { withChatContext } from '../context';

import { LoadingIndicator } from './LoadingIndicator';

import PropTypes from 'prop-types';
import { MessageSimple } from './MessageSimple';
import { Attachment } from './Attachment';
import { ChannelInner } from './ChannelInner';

/**
 * Channel - Wrapper component for a channel. It needs to be place inside of the Chat component.
 * ChannelHeader, MessageList, Thread and MessageInput should be used as children of the Channel component.
 *
 * @example ./docs/Channel.md
 * @extends PureComponent
 */
class Channel extends PureComponent {
  constructor(props) {
    super(props);
    this.state = { error: false };
  }
  static propTypes = {
    /** Which channel to connect to, will initialize the channel if it's not initialized yet */
    channel: PropTypes.shape({
      watch: PropTypes.func,
    }).isRequired,
    /** Client is passed automatically via the Chat Context */
    client: PropTypes.object.isRequired,
    /** The loading indicator to use */
    LoadingIndicator: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
    Message: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
    Attachment: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  };

  static defaultProps = {
    LoadingIndicator,
    Message: MessageSimple,
    Attachment,
  };

  render() {
    if (!this.props.channel.cid) {
      return null; // <div>Select a channel</div>;
    }
    // We use a wrapper to make sure the key variable is set.
    // this ensures that if you switch channel the component is recreated
    return <ChannelInner {...this.props} key={this.props.channel.cid} />;
  }
}

Channel = withChatContext(Channel);

export { Channel };
