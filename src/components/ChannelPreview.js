import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import { ChannelPreviewCountOnly } from './ChannelPreviewCountOnly';

export class ChannelPreview extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      lastMessage: {},
      unread: 0,
      lastRead: new Date(),
    };
  }

  static propTypes = {
    /** **Available from [chat context](https://getstream.github.io/stream-chat-react/#chat)** */
    channel: PropTypes.object.isRequired,
    /** Current selected channel object */
    activeChannel: PropTypes.object.isRequired,
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
    Preview: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
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

    this.setState({ unread });
    channel.on('message.new', this.handleEvent);
  }

  componentWillUnmount() {
    const channel = this.props.channel;
    channel.off('message.new', this.handleEvent);
  }

  handleEvent = (event) => {
    const channel = this.props.channel;
    const isActive = this.props.activeChannel.cid === channel.cid;
    if (!isActive) {
      const unread = channel.countUnread(this.state.lastRead);
      this.setState({ lastMessage: event.message, unread });
    } else {
      this.setState({ lastMessage: event.message, unread: 0 });
    }
  };

  componentDidUpdate(prevProps) {
    if (this.props.activeChannel.cid !== prevProps.activeChannel.cid) {
      const isActive = this.props.activeChannel.cid === this.props.channel.cid;
      if (isActive) {
        this.setState({ unread: 0, lastRead: new Date() });
      }
    }
  }

  getLatestMessage = () => {
    const { channel } = this.props;

    const latestMessage =
      channel.state.messages[channel.state.messages.length - 1];

    if (!latestMessage) {
      return 'Nothing yet...';
    }
    if (latestMessage.deleted_at) {
      return 'Message deleted';
    }
    if (latestMessage.text) {
      return latestMessage.text;
    } else {
      if (latestMessage.command) {
        return '/' + latestMessage.command;
      }
      if (latestMessage.attachments.length) {
        return '🏙 Attachment...';
      }
      return 'Empty message...';
    }
  };

  render() {
    const props = { ...this.state, ...this.props };

    const { Preview } = this.props;
    return (
      <Preview
        {...props}
        latestMessage={this.getLatestMessage()}
        active={this.props.activeChannel.cid === this.props.channel.cid}
      />
    );
  }
}
