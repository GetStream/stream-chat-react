import React, { PureComponent } from 'react';
import { withChatContext, ChannelContext } from '../context';

import { LoadingIndicator } from './LoadingIndicator';

import uuidv4 from 'uuid/v4';
import PropTypes from 'prop-types';
import Immutable from 'seamless-immutable';
import Visibility from 'visibilityjs';
import { logChatPromiseExecution } from 'stream-chat';
import { MessageSimple } from './MessageSimple';
import { Attachment } from './Attachment';
import debounce from 'lodash/debounce';
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

class ChannelInner extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      error: false,
      // Loading the intial content of the channel
      loading: true,
      // Loading more messages
      loadingMore: false,
      hasMore: true,
      messages: Immutable([]),
      online: 0,
      typing: Immutable({}),
      watchers: Immutable({}),
      members: Immutable({}),
      seen: Immutable({}),

      thread: false,
      threadMessages: [],
      threadLoadingMore: false,
      threadHasMore: true,
    };

    // hard limit to prevent you from scrolling faster than 1 page per 2 seconds
    this._loadMoreFinishedDebounced = debounce(this.loadMoreFinished, 2000, {
      leading: true,
      trailing: true,
    });

    // hard limit to prevent you from scrolling faster than 1 page per 2 seconds
    this._loadMoreThreadFinishedDebounced = debounce(
      this.loadMoreThreadFinished,
      2000,
      {
        leading: true,
        trailing: true,
      },
    );
  }

  static propTypes = {
    /** Which channel to connect to */
    channel: PropTypes.shape({
      watch: PropTypes.func,
    }).isRequired,
    /** Client is passed via the Chat Context */
    client: PropTypes.object.isRequired,
    /** The loading indicator to use */
    LoadingIndicator: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
  };

  async componentDidMount() {
    const channel = this.props.channel;
    let errored = false;
    if (!channel.initialized) {
      try {
        await channel.watch();
      } catch (e) {
        this.setState({ error: true });
        errored = true;
      }
    }
    this.originalTitle = document.title;
    this.lastSeen = new Date();
    if (!errored) {
      this.copyChannelState();
      this.listenToChanges();
    }
  }

  componentWillUnmount() {
    this.props.channel.off(this.boundHandler);
    if (this.visibilityListener) {
      Visibility.unbind(this.visibilityListener);
    }
  }

  renderLoading = () => {
    const Loader = this.props.LoadingIndicator;
    return <Loader isLoading={true} />;
  };

  openThread = (e, message) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    const channel = this.props.channel;
    const threadMessages = channel.state.threads[message.id] || [];

    this.setState({
      thread: message,
      threadMessages,
    });
  };

  loadMoreThread = async () => {
    // prevent duplicate loading events...
    if (this.state.threadLoadingMore) return;
    this.setState({
      threadLoadingMore: true,
    });
    const channel = this.props.channel;
    const parentID = this.state.thread.id;
    const oldMessages = channel.state.threads[parentID] || [];
    const oldestMessageID = oldMessages[0] ? oldMessages[0].id : null;
    const limit = 50;
    const queryResponse = await channel.queryReplies(parentID, {
      limit,
      id_lt: oldestMessageID,
    });
    const hasMore = queryResponse.messages.length === limit;

    const threadMessages = channel.state.threads[parentID] || [];

    // next set loadingMore to false so we can start asking for more data...
    this._loadMoreThreadFinishedDebounced(hasMore, threadMessages);
  };

  loadMoreThreadFinished = (threadHasMore, threadMessages) => {
    this.setState({
      threadLoadingMore: false,
      threadHasMore,
      threadMessages,
    });
  };

  closeThread = (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    this.setState({
      thread: null,
      threadMessages: [],
    });
  };

  copyChannelState() {
    const channel = this.props.channel;

    this.setState({
      messages: channel.state.messages,
      seen: channel.state.seen,
      watchers: channel.state.watchers,
      members: channel.state.members,
      online: channel.state.online,
      loading: false,
      typing: {},
    });

    channel.markSeen();
  }

  updateMessage = (updatedMessage, extraState) => {
    const channel = this.props.channel;

    extraState = extraState || {};

    // adds the message to the local channel state..
    // this adds to both the main channel state as well as any reply threads
    channel.state.addMessageSorted(updatedMessage);

    // update the Channel component state
    if (this.state.thread && updatedMessage.parent_id) {
      extraState.threadMessages =
        channel.state.threads[updatedMessage.parent_id] || [];
    }
    this.setState({ messages: channel.state.messages, ...extraState });
  };

  removeMessage = (message) => {
    const channel = this.props.channel;
    channel.state.removeMessage(message);
    this.setState({ messages: channel.state.messages });
  };

  removeEphemeralMessages() {
    const c = this.props.channel;
    c.state.selectRegularMessages();
    this.setState({ messages: c.state.messages });
  }

  createMessagePreview = (text, attachments, parent) => {
    // create a preview of the message
    const tmpID = `${this.props.client.userID}-` + uuidv4();
    const message = {
      text,
      html: text,
      __html: text,
      //id: tmpID,
      tmp_id: tmpID,
      type: 'regular',
      status: 'sending',
      user: {
        id: this.props.client.userID,
        ...this.props.client.user,
      },
      created_at: new Date(),
      attachments,
      reactions: [],
    };

    if (parent && parent.id) {
      message.parent_id = parent.id;
    }
    return message;
  };

  _sendMessage = async (message) => {
    const { text, attachments, tmp_id, parent_id } = message;
    const messageData = {
      text,
      attachments,
      tmp_id,
      parent_id,
    };

    try {
      const messageResponse = await this.props.channel.sendMessage(messageData);
      // replace it after send is completed
      if (messageResponse.message) {
        messageResponse.message.status = 'received';
        this.updateMessage(messageResponse.message);
      }
    } catch (error) {
      // set the message to failed..
      message.status = 'failed';
      this.updateMessage(message);
    }
  };

  sendMessage = async ({ text, attachments = [], parent }) => {
    // remove error messages upon submit
    this.props.channel.state.filterErrorMessages();

    // create a local preview message to show in the UI
    const messagePreview = this.createMessagePreview(text, attachments, parent);

    // first we add the message to the UI
    this.updateMessage(messagePreview, {
      messageInput: '',
      commands: [],
      userAutocomplete: [],
    });

    await this._sendMessage(messagePreview);
  };

  retrySendMessage = async (message) => {
    // set the message status to sending
    message = message.asMutable();
    message.status = 'sending';
    this.updateMessage(message);
    // actually try to send the message...
    await this._sendMessage(message);
  };

  handleEvent = (e) => {
    const channel = this.props.channel;
    let threadMessages = [];
    const threadState = {};
    if (this.state.thread) {
      threadMessages = channel.state.threads[this.state.thread.id] || [];
      threadState['threadMessages'] = threadMessages;
    }

    if (
      this.state.thread &&
      e.message &&
      e.message.id === this.state.thread.id
    ) {
      threadState['thread'] = e.message;
    }

    if (e.type === 'message.new') {
      let mainChannelUpdated = true;
      if (e.message.parent_id && !e.message.show_in_channel) {
        mainChannelUpdated = false;
      }

      if (mainChannelUpdated) {
        if (Visibility.state() === 'visible') {
          this.markSeen(channel);
        } else {
          const unread = this.props.channel.countUnread(this.lastSeen);
          document.title = `(${unread}) ${this.originalTitle}`;
        }
      }
    }

    this.setState({
      messages: channel.state.messages,
      watchers: channel.state.watchers,
      seen: channel.state.seen,
      typing: channel.state.typing,
      online: channel.state.online,
      ...threadState,
    });
  };

  markSeen = (channel) => {
    if (!channel.getConfig().seen_events) {
      return;
    }
    this.lastSeen = new Date();

    logChatPromiseExecution(channel.markSeen(), 'mark seen');

    if (this.originalTitle) {
      document.title = this.originalTitle;
    }
  };

  listenToChanges() {
    // The more complex sync logic is done in chat.js
    // listen to client.connection.recovered and all channel events
    this.props.client.on('connection.recovered', this.handleEvent);
    const channel = this.props.channel;
    channel.on(this.handleEvent);
    this.boundMarkSeen = this.markSeen.bind(this, channel);
    this.visibilityListener = Visibility.change((e, state) => {
      if (state === 'visible') {
        this.boundMarkSeen();
      }
    });
  }

  loadMore = async () => {
    // prevent duplicate loading events...
    if (this.state.loadingMore) return;
    this.setState({ loadingMore: true });

    const oldestID = this.state.messages[0] ? this.state.messages[0].id : null;
    const perPage = 100;
    let queryResponse;
    try {
      queryResponse = await this.props.channel.query({
        messages: { limit: perPage, id_lt: oldestID },
      });
    } catch (e) {
      console.warn('message pagination request failed with error', e);
      this.setState({ loadingMore: false });
      return;
    }
    const hasMore = queryResponse.messages.length === perPage;

    this._loadMoreFinishedDebounced(hasMore, this.props.channel.state.messages);
  };

  loadMoreFinished = (hasMore, messages) => {
    this.setState({
      loadingMore: false,
      hasMore,
      messages,
    });
  };

  getContext = () => ({
    ...this.state,
    channels: this.props.channels,
    client: this.props.client,
    channel: this.props.channel,
    Message: this.props.Message,
    Attachment: this.props.Attachment,
    updateMessage: this.updateMessage,
    removeMessage: this.removeMessage,
    sendMessage: this.sendMessage,
    retrySendMessage: this.retrySendMessage,
    resetNotification: this.resetNotification,

    loadMore: this.loadMore,
    listenToScroll: this.listenToScroll,

    // thread related
    openThread: this.openThread,
    closeThread: this.closeThread,
    loadMoreThread: this.loadMoreThread,
  });

  renderComponent = () => this.props.children;

  render() {
    let core;
    if (this.state.error) {
      core = <div>Error: {this.state.error.message}</div>;
    } else if (this.state.loading) {
      core = <LoadingIndicator size={25} isLoading={true} />;
    } else if (!this.props.channel || !this.props.channel.watch) {
      core = <div>Channel Missing</div>;
    } else {
      core = (
        <ChannelContext.Provider value={this.getContext()}>
          <div className="str-chat__container">{this.renderComponent()}</div>
        </ChannelContext.Provider>
      );
    }

    return (
      <div className={`str-chat str-chat-channel ${this.props.theme}`}>
        {core}
      </div>
    );
  }
}

Channel = withChatContext(Channel);

export { Channel };
