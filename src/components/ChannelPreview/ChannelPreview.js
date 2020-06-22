/* eslint-disable */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import ChannelPreviewCountOnly from './ChannelPreviewCountOnly';
import { withTranslationContext, withChatContext } from '../../context';
import {
  getLatestMessagePreview,
  getDisplayTitle,
  getDisplayImage,
} from './utils';

class ChannelPreview extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      lastMessage: {},
      unread: 0,
    };
  }

  static propTypes = {
    /** **Available from [chat context](https://getstream.github.io/stream-chat-react/#chat)** */
    channel: PropTypes.object.isRequired,
    /** Current selected channel object */
    activeChannel: PropTypes.object,
    /** Setter for selected channel */
    setActiveChannel: PropTypes.func.isRequired,
    /**
     * Available built-in options (also accepts the same props as):
     *
     * 1. [ChannelPreviewCompact](https://getstream.github.io/stream-chat-react/#ChannelPreviewCompact) (default)
     * 2. [ChannelPreviewLastMessage](https://getstream.github.io/stream-chat-react/#ChannelPreviewLastMessage)
     * 3. [ChannelPreviewMessanger](https://getstream.github.io/stream-chat-react/#ChannelPreviewMessanger)
     *
     * The Preview to use, defaults to ChannelPreviewLastMessage
     * */
    Preview: PropTypes.elementType,
    /**
     * Object containing watcher parameters
     * @see See [Pagination documentation](https://getstream.io/chat/docs/#channel_pagination) for a list of available fields for sort.
     * */
    watchers: PropTypes.object,
  };

  static defaultProps = {
    Preview: ChannelPreviewCountOnly,
  };

  componentDidMount() {
    // listen to change...
    const channel = this.props.channel;
    const unread = channel.countUnread();

    if (this.isActive()) {
      this.setState({ unread: 0 });
    } else {
      this.setState({ unread });
    }

    channel.on('message.new', this.handleEvent);
    channel.on('message.updated', this.handleEvent);
    channel.on('message.deleted', this.handleEvent);
  }

  componentWillUnmount() {
    const channel = this.props.channel;
    channel.off('message.new', this.handleEvent);
    channel.off('message.updated', this.handleEvent);
    channel.off('message.deleted', this.handleEvent);
  }

  isActive = () => {
    const { activeChannel, channel } = this.props;

    return activeChannel && activeChannel.cid === channel.cid;
  };

  handleEvent = (event) => {
    const { channel } = this.props;

    if (!this.isActive()) {
      const unread = channel.countUnread();
      this.setState({ lastMessage: event.message, unread });
    } else {
      this.setState({ lastMessage: event.message, unread: 0 });
    }
  };

  componentDidUpdate(prevProps) {
    if (
      this.props.activeChannel &&
      prevProps.activeChannel &&
      this.props.activeChannel.cid !== prevProps.activeChannel.cid
    ) {
      const isActive = this.props.activeChannel.cid === this.props.channel.cid;
      if (isActive) {
        this.setState({ unread: 0 });
      }
    }
  }

  render() {
    const props = { ...this.state, ...this.props };

    const { Preview, channel, client, activeChannel, t } = this.props;
    return (
      <Preview
        {...props}
        latestMessage={getLatestMessagePreview(channel, t)}
        latestMessageDisplayTest={getLatestMessagePreview(channel, t)}
        displayTitle={getDisplayTitle(channel, client.user)}
        displayImage={getDisplayImage(channel, client.user)}
        active={activeChannel && activeChannel.cid === channel.cid}
      />
    );
  }
}

ChannelPreview = withTranslationContext(withChatContext(ChannelPreview));

export default ChannelPreview;
