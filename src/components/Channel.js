import React, { PureComponent } from 'react';
import { withChatContext, ChannelContext } from '../context';

import { LoadingIndicator } from './LoadingIndicator';
import { LoadingErrorIndicator } from './LoadingErrorIndicator';

import uuidv4 from 'uuid/v4';
import PropTypes from 'prop-types';
import Immutable from 'seamless-immutable';
import Visibility from 'visibilityjs';
import { logChatPromiseExecution } from 'stream-chat';
import { MessageSimple } from './MessageSimple';
import { Attachment } from './Attachment';
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';
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
    /**
     * Error indicator UI component. This will be shown on the screen if channel query fails.
     *
     * Defaults to and accepts same props as: [LoadingErrorIndicator](https://getstream.github.io/stream-chat-react/#loadingerrorindicator)
     *
     * */
    LoadingErrorIndicator: PropTypes.oneOfType([
      PropTypes.node,
      PropTypes.func,
    ]),
    /**
     * Loading indicator UI component. This will be shown on the screen until the messages are
     * being queried from channelœ. Once the messages are loaded, loading indicator is removed from the screen
     * and replaced with children of the Channel component.
     *
     * Defaults to and accepts same props as: [LoadingIndicator](https://github.com/GetStream/stream-chat-react/blob/master/src/components/LoadingIndicator.js)
     */
    LoadingIndicator: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
    /**
     * Message UI component to display a message in message list.
     *
     * Available built-in components (also accepts the same props as):
     *
     * 1. [MessageSimple](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageSimple.js) (default)
     * 2. [MessageTeam](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageTeam.js)
     * 3. [MessageLivestream](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageLivestream.js)
     * 3. [MessageCommerce](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageCommerce.js)
     *
     * */
    Message: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
    /**
     * Attachment UI component to display attachment in individual message.
     *
     * Defaults to and accepts same props as: [Attachment](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment.js)
     * */
    Attachment: PropTypes.oneOfType([PropTypes.node, PropTypes.func]),
    /**
     * Handle for click on @mention in message
     *
     * @param {Event} event DOM Click event
     * @param {User} user   Target [user object](https://getstream.io/chat/docs/#chat-doc-set-user) which is clicked
     */
    onMentionsClick: PropTypes.func,
    /**
     * Handle for hover on @mention in message
     *
     * @param {Event} event DOM hover event
     * @param {User} user   Target [user object](https://getstream.io/chat/docs/#chat-doc-set-user) which is hovered
     */
    onMentionsHover: PropTypes.func,
    /** Weather to allow multiple attachment uploads */
    multipleUploads: PropTypes.bool,
    /** List of accepted file types */
    acceptedFiles: PropTypes.array,
    /** Maximum number of attachments allowed per message */
    maxNumberOfFiles: PropTypes.number,
    /** Override send message request (Advanced usage only)
     *
     * @param {String} channelId full channel ID in format of `type:id`
     * @param {Object} message
     */
    doSendMessageRequest: PropTypes.func,
    /** Override update(edit) message request (Advanced usage only)
     *
     * @param {String} channelId full channel ID in format of `type:id`
     * @param {Object} updatedMessage
     */
    doUpdateMessageRequest: PropTypes.func,
  };

  static defaultProps = {
    LoadingIndicator,
    LoadingErrorIndicator,
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
      // Loading the initial content of the channel
      loading: true,
      // Loading more messages
      loadingMore: false,
      hasMore: true,
      messages: Immutable([]),
      online: true,
      typing: Immutable({}),
      watchers: Immutable({}),
      members: Immutable({}),
      read: Immutable({}),
      eventHistory: {},
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

    this._markReadThrottled = throttle(this.markRead, 500, {
      leading: true,
      trailing: true,
    });
    this._setStateThrottled = throttle(this.setState, 500, {
      leading: true,
      trailing: true,
    });
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
    LoadingErrorIndicator: PropTypes.oneOfType([
      PropTypes.node,
      PropTypes.func,
    ]),
  };

  async componentDidMount() {
    const channel = this.props.channel;
    let errored = false;
    if (!channel.initialized) {
      try {
        await channel.watch();
      } catch (e) {
        this.setState({ error: e });
        errored = true;
      }
    }
    this.originalTitle = document.title;
    this.lastRead = new Date();
    if (!errored) {
      this.copyChannelState();
      this.listenToChanges();
    }
  }

  componentDidUpdate() {
    // If there is an active thread, then in that case we should sync
    // it with updated state of channel.
    if (this.state.thread) {
      for (let i = this.state.messages.length - 1; i >= 0; i--) {
        if (this.state.messages[i].id === this.state.thread.id) {
          this.setState({
            thread: this.state.messages[i],
          });
          break;
        }
      }
    }
  }

  componentWillUnmount() {
    this.props.client.off('connection.recovered', this.handleEvent);
    this.props.channel.off(this.handleEvent);
    this._loadMoreFinishedDebounced.cancel();
    this._loadMoreThreadFinishedDebounced.cancel();

    if (this.visibilityListener || this.visibilityListener === 0) {
      Visibility.unbind(this.visibilityListener);
    }
  }

  openThread = (message, e) => {
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
    const queryResponse = await channel.getReplies(parentID, {
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
      read: channel.state.read,
      watchers: channel.state.watchers,
      members: channel.state.members,
      watcher_count: channel.state.watcher_count,
      loading: false,
      typing: Immutable({}),
    });

    if (channel.countUnread() > 0) channel.markRead();
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

  createMessagePreview = (text, attachments, parent, mentioned_users) => {
    // create a preview of the message
    const clientSideID = `${this.props.client.userID}-` + uuidv4();
    const message = {
      text,
      html: text,
      __html: text,
      //id: tmpID,
      id: clientSideID,
      type: 'regular',
      status: 'sending',
      user: {
        id: this.props.client.userID,
        ...this.props.client.user,
      },
      created_at: new Date(),
      attachments,
      mentioned_users,
      reactions: [],
    };

    if (parent && parent.id) {
      message.parent_id = parent.id;
    }
    return message;
  };

  editMessage = (updatedMessage) => {
    if (this.props.doUpdateMessageRequest) {
      return Promise.resolve(
        this.props.doUpdateMessageRequest(
          this.props.channel.cid,
          updatedMessage,
        ),
      );
    }

    return this.props.client.updateMessage(updatedMessage);
  };

  _sendMessage = async (message) => {
    const { text, attachments, id, parent_id, mentioned_users } = message;
    const messageData = {
      text,
      attachments,
      mentioned_users,
      id,
      parent_id,
    };

    try {
      let messageResponse;
      if (this.props.doSendMessageRequest) {
        messageResponse = await this.props.doSendMessageRequest(
          this.props.channel.cid,
          messageData,
        );
      } else {
        messageResponse = await this.props.channel.sendMessage(messageData);
      }

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

  sendMessage = async ({
    text,
    attachments = [],
    mentioned_users = [],
    parent,
  }) => {
    // remove error messages upon submit
    this.props.channel.state.filterErrorMessages();

    // create a local preview message to show in the UI
    const messagePreview = this.createMessagePreview(
      text,
      attachments,
      parent,
      mentioned_users,
    );

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
    const { channel } = this.props;
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
      threadState['thread'] = channel.state.messageToImmutable(e.message);
    }

    if (Object.keys(threadState).length > 0) {
      // TODO: in theory we should do 1 setState call not 2,
      // However the setStateThrottled doesn't support this
      this.setState(threadState);
    }

    if (e.type === 'message.new') {
      let mainChannelUpdated = true;
      if (e.message.parent_id && !e.message.show_in_channel) {
        mainChannelUpdated = false;
      }

      if (
        mainChannelUpdated &&
        e.message.user.id !== this.props.client.userID
      ) {
        if (Visibility.state() === 'visible') {
          this._markReadThrottled(channel);
        } else {
          const unread = channel.countUnread(this.lastRead);
          document.title = `(${unread}) ${this.originalTitle}`;
        }
      }
    }

    if (e.type === 'member.added') {
      this.addToEventHistory(e);
    }

    if (e.type === 'member.removed') {
      this.addToEventHistory(e);
    }

    this._setStateThrottled({
      messages: channel.state.messages,
      watchers: channel.state.watchers,
      read: channel.state.read,
      typing: channel.state.typing,
      watcher_count: channel.state.watcher_count,
    });
  };

  addToEventHistory = (e) => {
    this.setState((prevState) => {
      if (!prevState.message || !prevState.message.length) {
        return;
      }
      const lastMessageId =
        prevState.messages[prevState.messages.length - 1].id;
      if (!prevState.eventHistory[lastMessageId])
        return {
          ...prevState,
          eventHistory: {
            ...prevState.eventHistory,
            [lastMessageId]: [e],
          },
        };

      return {
        ...prevState,
        eventHistory: {
          ...prevState.eventHistory,
          [lastMessageId]: [...prevState.eventHistory[lastMessageId], e],
        },
      };
    });
  };

  markRead = (channel) => {
    if (!channel.getConfig().read_events) {
      return;
    }
    this.lastRead = new Date();

    logChatPromiseExecution(channel.markRead(), 'mark read');

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
    this.boundMarkRead = this.markRead.bind(this, channel);
    this.visibilityListener = Visibility.change((e, state) => {
      if (state === 'visible') {
        this.boundMarkRead();
      }
    });
  }

  loadMore = async (limit = 100) => {
    // prevent duplicate loading events...
    if (this.state.loadingMore) return;
    this.setState({ loadingMore: true });

    const oldestMessage = this.state.messages[0];

    if (oldestMessage && oldestMessage.status !== 'received') {
      this.setState({
        loadingMore: false,
      });

      return;
    }

    const oldestID = oldestMessage ? oldestMessage.id : null;

    const perPage = limit;
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

  _onMentionsHoverOrClick = (e, mentioned_users) => {
    if (!this.props.onMentionsHover && !this.props.onMentionsClick) return;

    const tagName = e.target.tagName.toLowerCase();
    const textContent = e.target.innerHTML.replace('*', '');
    if (tagName === 'strong' && textContent[0] === '@') {
      const userName = textContent.replace('@', '');
      const user = mentioned_users.find(
        (user) => user.name === userName || user.id === userName,
      );
      if (
        this.props.onMentionsHover &&
        typeof this.props.onMentionsHover === 'function' &&
        e.type === 'mouseover'
      ) {
        this.props.onMentionsHover(e, user);
      }
      if (
        this.props.onMentionsClick &&
        e.type === 'click' &&
        typeof this.props.onMentionsClick === 'function'
      ) {
        this.props.onMentionsClick(e, user);
      }
    }
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
    client: this.props.client,
    channel: this.props.channel,
    Message: this.props.Message,
    Attachment: this.props.Attachment,
    multipleUploads: this.props.multipleUploads,
    acceptedFiles: this.props.acceptedFiles,
    maxNumberOfFiles: this.props.maxNumberOfFiles,
    updateMessage: this.updateMessage,
    removeMessage: this.removeMessage,
    sendMessage: this.sendMessage,
    editMessage: this.editMessage,
    retrySendMessage: this.retrySendMessage,
    loadMore: this.loadMore,

    // thread related
    openThread: this.openThread,
    closeThread: this.closeThread,
    loadMoreThread: this.loadMoreThread,
    onMentionsClick: this._onMentionsHoverOrClick,
    onMentionsHover: this._onMentionsHoverOrClick,
  });

  renderComponent = () => this.props.children;

  render() {
    let core;
    const LoadingIndicator = this.props.LoadingIndicator;
    const LoadingErrorIndicator = this.props.LoadingErrorIndicator;

    if (this.state.error) {
      core = (
        <LoadingErrorIndicator error={this.state.error}></LoadingErrorIndicator>
      );
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
