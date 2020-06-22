/* eslint-disable */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import ChannelPreviewCountOnly from './ChannelPreviewCountOnly';
import { withTranslationContext, withChatContext } from '../../context';

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

    this.setState({ unread });
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

  handleEvent = (event) => {
    const channel = this.props.channel;
    const isActive =
      this.props.activeChannel && this.props.activeChannel.cid === channel.cid;
    if (!isActive) {
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

  getLatestMessage = () => {
    const { channel, t } = this.props;

    const latestMessage =
      channel.state.messages[channel.state.messages.length - 1];

    if (!latestMessage) {
      return t('Nothing yet...');
    }
    if (latestMessage.deleted_at) {
      return t('Message deleted');
    }
    if (latestMessage.text) {
      return latestMessage.text;
    } else {
      if (latestMessage.command) {
        return '/' + latestMessage.command;
      }
      if (latestMessage.attachments.length) {
        return t('🏙 Attachment...');
      }
      return t('Empty message...');
    }
  };

  getDisplayTitle = () => {
    const { channel, client } = this.props;
    let title = channel.data.name;
    const members = Object.values(channel.state.members);

    if (!title && members.length === 2) {
      const otherMember = members.find((m) => m.user.id !== client.user.id);
      title = otherMember.user.name;
    }

    return title;
  };

  getDisplayImage = () => {
    const { channel, client } = this.props;
    let image = channel.data.image;
    const members = Object.values(channel.state.members);

    if (!image && members.length === 2) {
      const otherMember = members.find((m) => m.user.id !== client.user.id);
      image = otherMember.user.image;
    }

    return image;
  };

  render() {
    const props = { ...this.state, ...this.props };

    const { Preview } = this.props;
    return (
      <Preview
        {...props}
        latestMessage={this.getLatestMessage()}
        displayTitle={this.getDisplayTitle()}
        displayImage={this.getDisplayImage()}
        active={
          this.props.activeChannel &&
          this.props.activeChannel.cid === this.props.channel.cid
        }
      />
    );
  }
}

ChannelPreview = withTranslationContext(withChatContext(ChannelPreview));

export default ChannelPreview;
