// @ts-check
import React, { Component } from 'react';
import PropTypes from 'prop-types';

import MessageSimple from './MessageSimple';
import { Attachment } from '../Attachment';
import {
  MESSAGE_ACTIONS,
  isUserMuted,
  validateAndGetMessage,
  getMessageActions,
  shouldMessageComponentUpdate,
} from './utils';
import { withTranslationContext } from '../../context';

/**
 * Message - A high level component which implements all the logic required for a message.
 * The actual rendering of the message is delegated via the "Message" property
 *
 * @example ../../docs/Message.md
 * @typedef { import('types').MessageComponentProps } Props
 * @typedef { import('types').MessageComponentState } State
 * @extends { Component<Props, State> }
 */
class Message extends Component {
  /**
   * @constructor
   * @param {Props} props
   */
  constructor(props) {
    super(props);
    this.state = {
      loading: false,
    };
  }

  static propTypes = {
    /** The message object */
    message: PropTypes.object.isRequired,
    /** The client connection object for connecting to Stream */
    client: PropTypes.object.isRequired,
    /** The current channel this message is displayed in */
    channel: PropTypes.object.isRequired,
    /** A list of users that have read this message */
    readBy: PropTypes.array,
    /** groupStyles, a list of styles to apply to this message. ie. top, bottom, single etc */
    groupStyles: PropTypes.array,
    /** Editing, if the message is currently being edited */
    editing: PropTypes.bool,
    /**
     * Message UI component to display a message in message list.
     * Available from [channel context](https://getstream.github.io/stream-chat-react/#channelcontext)
     * */
    Message: PropTypes.elementType,
    /**
     * Attachment UI component to display attachment in individual message.
     * Available from [channel context](https://getstream.github.io/stream-chat-react/#channelcontext)
     * */
    Attachment: PropTypes.elementType,
    /** render HTML instead of markdown. Posting HTML is only allowed server-side */
    unsafeHTML: PropTypes.bool,
    /**
     * Array of allowed actions on message. e.g. ['edit', 'delete', 'mute', 'flag']
     * If all the actions need to be disabled, empty array or false should be provided as value of prop.
     * */
    messageActions: PropTypes.oneOfType([PropTypes.bool, PropTypes.array]),
    /**
     * Function that returns message/text as string to be shown as notification, when request for flagging a message is successful
     *
     * This function should accept following params:
     *
     * @param message A [message object](https://getstream.io/chat/docs/#message_format) which is flagged.
     *
     * */
    getFlagMessageSuccessNotification: PropTypes.func,
    /**
     * Function that returns message/text as string to be shown as notification, when request for flagging a message runs into error
     *
     * This function should accept following params:
     *
     * @param message A [message object](https://getstream.io/chat/docs/#message_format) which is flagged.
     *
     * */
    getFlagMessageErrorNotification: PropTypes.func,
    /**
     * Function that returns message/text as string to be shown as notification, when request for muting a user is successful
     *
     * This function should accept following params:
     *
     * @param user A user object which is being muted
     *
     * */
    getMuteUserSuccessNotification: PropTypes.func,
    /**
     * Function that returns message/text as string to be shown as notification, when request for muting a user runs into error
     *
     * This function should accept following params:
     *
     * @param user A user object which is being muted
     *
     * */
    getMuteUserErrorNotification: PropTypes.func,
    /** Latest message id on current channel */
    lastReceivedId: PropTypes.string,
    /** DOMRect object for parent MessageList component */
    messageListRect: PropTypes.object,
    /** @see See [Channel Context](https://getstream.github.io/stream-chat-react/#channelcontext) */
    members: PropTypes.object,
    /**
     * Function to add custom notification on messagelist
     *
     * @param text Notification text to display
     * @param type Type of notification. 'success' | 'error'
     * */
    addNotification: PropTypes.func,
    /** Sets the editing state */
    setEditingState: PropTypes.func,
    /** @see See [Channel Context](https://getstream.github.io/stream-chat-react/#channelcontext) */
    updateMessage: PropTypes.func,
    /** @see See [Channel Context](https://getstream.github.io/stream-chat-react/#channelcontext) */
    removeMessage: PropTypes.func,
    /** @see See [Channel Context](https://getstream.github.io/stream-chat-react/#channelcontext) */
    retrySendMessage: PropTypes.func,
    /** @see See [Channel Context](https://getstream.github.io/stream-chat-react/#channelcontext) */
    onMentionsClick: PropTypes.func,
    /** @see See [Channel Context](https://getstream.github.io/stream-chat-react/#channelcontext) */
    onMentionsHover: PropTypes.func,
    /**
     * The handler for click event on the user that posted the message
     *
     * @param event Dom click event which triggered handler.
     * @param user the User object for the corresponding user.
     */
    onUserClick: PropTypes.func,
    /**
     * The handler for hover events on the user that posted the message
     *
     * @param event Dom hover event which triggered handler.
     * @param user the User object for the corresponding user.
     */
    onUserHover: PropTypes.func,
    /** @see See [Channel Context](https://getstream.github.io/stream-chat-react/#channelcontext) */
    openThread: PropTypes.func,
    /** Handler to clear the edit state of message. It is defined in [MessageList](https://getstream.github.io/stream-chat-react/#messagelist) component */
    clearEditingState: PropTypes.func,
    /**
     * Additional props for underlying MessageInput component.
     * Available props - https://getstream.github.io/stream-chat-react/#messageinput
     * */
    additionalMessageInputProps: PropTypes.object,
    /**
     * The component that will be rendered if the message has been deleted.
     * All props are passed into this component.
     */
    MessageDeleted: PropTypes.elementType,
  };

  static defaultProps = {
    Message: MessageSimple,
    readBy: [],
    groupStyles: [],
    Attachment,
    editing: false,
    messageActions: Object.keys(MESSAGE_ACTIONS),
  };

  /** @type {(nextProps: Props) => boolean} Typescript syntax */
  shouldComponentUpdate(nextProps) {
    return shouldMessageComponentUpdate(nextProps, this.props);
  }

  /** @type {(message: import('stream-chat').MessageResponse) => boolean} Typescript syntax */
  isMyMessage = (message) =>
    !!message?.user &&
    !!this.props.client?.user &&
    this.props.client.user.id === message.user.id;

  isAdmin = () =>
    this.props.client?.user?.role === 'admin' ||
    this.props.channel?.state?.membership?.role === 'admin';

  isOwner = () => this.props.channel?.state?.membership?.role === 'owner';

  isModerator = () =>
    this.props.channel?.state?.membership?.role === 'channel_moderator' ||
    this.props.channel?.state?.membership?.role === 'moderator';

  /** @type {(message: import('stream-chat').MessageResponse) => boolean} Typescript syntax */
  canEditMessage = (message) =>
    this.isMyMessage(message) ||
    this.isModerator() ||
    this.isOwner() ||
    this.isAdmin();

  /** @type {(message: import('stream-chat').MessageResponse) => boolean} Typescript syntax */
  canDeleteMessage = (message) => this.canEditMessage(message);

  /** @type {(event: React.MouseEvent<HTMLElement>) => Promise<void>} Typescript syntax */
  handleFlag = async (event) => {
    event.preventDefault();

    const {
      getFlagMessageSuccessNotification,
      getFlagMessageErrorNotification,
      message,
      client,
      addNotification,
      t,
    } = this.props;
    if (!client || !t || !addNotification || !message) {
      return;
    }
    try {
      await client.flagMessage(message.id);
      const successMessage =
        getFlagMessageSuccessNotification &&
        validateAndGetMessage(getFlagMessageSuccessNotification, [message]);
      addNotification(
        successMessage || t('Message has been successfully flagged'),
        'success',
      );
    } catch (e) {
      const errorMessage =
        getFlagMessageErrorNotification &&
        validateAndGetMessage(getFlagMessageErrorNotification, [message]);
      addNotification(
        errorMessage ||
          t(
            'Error adding flag: Either the flag already exist or there is issue with network connection ...',
          ),
        'error',
      );
    }
  };

  /** @type {(event: React.MouseEvent<HTMLElement>) => Promise<void>} Typescript syntax */
  handleMute = async (event) => {
    event.preventDefault();

    const {
      getMuteUserSuccessNotification,
      getMuteUserErrorNotification,
      message,
      client,
      addNotification,
      t,
    } = this.props;
    if (!t || !message || !addNotification || !client) {
      return;
    }
    if (!this.isUserMuted()) {
      try {
        if (!message.user) {
          return;
        }
        await client.muteUser(message.user.id);
        const successMessage =
          getMuteUserSuccessNotification &&
          validateAndGetMessage(getMuteUserSuccessNotification, [message.user]);

        addNotification(
          successMessage ||
            t(`{{ user }} has been muted`, {
              user: message.user.name || message.user.id,
            }),
          'success',
        );
      } catch (e) {
        const errorMessage =
          getMuteUserErrorNotification &&
          validateAndGetMessage(getMuteUserErrorNotification, [message.user]);

        addNotification(errorMessage || t('Error muting a user ...'), 'error');
      }
    } else {
      try {
        if (!message.user) {
          return;
        }
        await client.unmuteUser(message.user.id);
        const fallbackMessage = t(`{{ user }} has been unmuted`, {
          user: message.user.name || message.user.id,
        });
        const successMessage =
          (getMuteUserSuccessNotification &&
            validateAndGetMessage(getMuteUserSuccessNotification, [
              message.user,
            ])) ||
          fallbackMessage;

        if (typeof successMessage === 'string') {
          addNotification(successMessage, 'success');
        }
      } catch (e) {
        const errorMessage =
          (getMuteUserErrorNotification &&
            validateAndGetMessage(getMuteUserErrorNotification, [
              message.user,
            ])) ||
          t('Error unmuting a user ...');
        if (typeof errorMessage === 'string') {
          addNotification(errorMessage, 'error');
        }
      }
    }
  };

  /** @type {(event: React.MouseEvent<HTMLElement>) => void} Typescript syntax */
  handleEdit = (event) => {
    const { setEditingState, message } = this.props;

    if (!message || !setEditingState) {
      return;
    }
    if (event !== undefined && event.preventDefault) {
      event.preventDefault();
    }

    setEditingState(message);
  };

  /** @type {(event: React.MouseEvent<HTMLElement>) => Promise<void>} Typescript syntax */
  handleDelete = async (event) => {
    event.preventDefault();
    const { message, client, updateMessage } = this.props;
    if (!message || !client || !updateMessage) {
      return;
    }
    const data = await client.deleteMessage(message.id);
    updateMessage(data.message);
  };

  /** @type {(reactionType: string, event: React.MouseEvent<HTMLElement>) => Promise<void>} Typescript syntax */
  handleReaction = async (reactionType, event) => {
    const { updateMessage, message, client, channel } = this.props;

    if (!updateMessage || !message || !channel || !client) {
      return;
    }
    if (event !== undefined && event.preventDefault) {
      event.preventDefault();
    }

    let userExistingReaction = null;

    const currentUser = client.userID;
    if (message.own_reactions) {
      message.own_reactions.forEach((reaction) => {
        // own user should only ever contain the current user id
        // just in case we check to prevent bugs with message updates from breaking reactions
        if (
          reaction.user &&
          currentUser === reaction.user.id &&
          reaction.type === reactionType
        ) {
          userExistingReaction = reaction;
        } else if (reaction.user && currentUser !== reaction.user.id) {
          console.warn(
            `message.own_reactions contained reactions from a different user, this indicates a bug`,
          );
        }
      });
    }

    const originalMessage = message;
    let reactionChangePromise;

    /*
    - Add the reaction to the local state
    - Make the API call in the background
    - If it fails, revert to the old message...
     */
    if (userExistingReaction) {
      reactionChangePromise = channel.deleteReaction(
        message.id,
        // @ts-ignore Typescript doesn't understand that the userExistingReaction variable might have been mutated inside the foreach loop
        userExistingReaction.type,
      );
    } else {
      // add the reaction
      const messageID = message.id;

      const reaction = { type: reactionType };

      // this.props.channel.state.addReaction(tmpReaction, this.props.message);
      reactionChangePromise = channel.sendReaction(messageID, reaction);
    }

    try {
      // only wait for the API call after the state is updated
      await reactionChangePromise;
    } catch (e) {
      // revert to the original message if the API call fails
      updateMessage(originalMessage);
    }
  };

  /** @type {(name: string, value: string, event: React.MouseEvent<HTMLElement>) => Promise<void>} Typescript syntax */
  handleAction = async (name, value, event) => {
    event.preventDefault();
    const { channel, message, updateMessage, removeMessage } = this.props;
    if (!message || !updateMessage || !removeMessage || !channel) {
      return;
    }
    const messageID = message.id;
    const formData = {
      [name]: value,
    };

    const data = await channel.sendAction(messageID, formData);

    if (data && data.message) {
      updateMessage(data.message);
    } else {
      removeMessage(message);
    }
  };

  /** @type {(message: import('stream-chat').Message) => Promise<void>} Typescript syntax */
  handleRetry = async (message) => {
    const { retrySendMessage } = this.props;
    if (!retrySendMessage) {
      return;
    }
    await retrySendMessage(message);
  };

  /** @type {(e: React.MouseEvent<HTMLElement>) => void} Typescript syntax */
  onMentionsClick = (e) => {
    const { onMentionsClick, message } = this.props;
    if (typeof onMentionsClick !== 'function' || !message?.mentioned_users) {
      return;
    }
    onMentionsClick(e, message.mentioned_users);
  };

  /** @type {(e: React.MouseEvent<HTMLElement>) => void} Typescript syntax */
  onMentionsHover = (e) => {
    const { onMentionsHover, message } = this.props;

    if (typeof onMentionsHover !== 'function' || !message?.mentioned_users) {
      return;
    }

    onMentionsHover(e, message.mentioned_users);
  };

  /** @type {(e: React.MouseEvent<HTMLElement>) => void} Typescript syntax */
  onUserClick = (e) => {
    const { onUserClick, message } = this.props;
    if (typeof onUserClick !== 'function' || !message?.user) {
      return;
    }

    onUserClick(e, message.user);
  };

  /** @type {(e: React.MouseEvent<HTMLElement>) => void} Typescript syntax */
  onUserHover = (e) => {
    const { message, onUserHover } = this.props;
    if (typeof onUserHover !== 'function' || !message?.user) {
      return;
    }

    onUserHover(e, message.user);
  };

  isUserMuted = () => {
    const { mutes, message } = this.props;
    return isUserMuted(message, mutes);
  };

  getMessageActions = () => {
    const { channel, message, messageActions } = this.props;
    const channelConfig = channel && channel.getConfig();
    if (!message || !messageActions) {
      return [];
    }

    return getMessageActions(messageActions, {
      canDelete: this.canDeleteMessage(message),
      canEdit: this.canEditMessage(message),
      canFlag: !this.isMyMessage(message),
      canMute: !this.isMyMessage(message) && !!channelConfig?.mutes,
    });
  };

  render() {
    const { channel, message } = this.props;
    const config = channel?.getConfig && channel.getConfig();

    const actionsEnabled =
      message && message.type === 'regular' && message.status === 'received';

    const MessageUIComponent = this.props.Message;
    return (
      MessageUIComponent && (
        <MessageUIComponent
          {...this.props}
          actionsEnabled={actionsEnabled}
          Message={MessageUIComponent}
          handleReaction={this.handleReaction}
          getMessageActions={this.getMessageActions}
          handleFlag={this.handleFlag}
          handleMute={this.handleMute}
          handleAction={this.handleAction}
          handleDelete={this.handleDelete}
          handleEdit={this.handleEdit}
          handleRetry={this.handleRetry}
          handleOpenThread={
            message &&
            this.props?.openThread &&
            this.props.openThread.bind(this, message)
          }
          isUserMuted={this.isUserMuted}
          isMyMessage={this.isMyMessage}
          channelConfig={config}
          onMentionsClickMessage={this.onMentionsClick}
          onMentionsHoverMessage={this.onMentionsHover}
          onUserClick={this.onUserClick}
          onUserHover={this.onUserHover}
        />
      )
    );
  }
}

export default withTranslationContext(Message);
