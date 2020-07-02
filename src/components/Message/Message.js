// @ts-check
import React, { useCallback, useContext } from 'react';
import PropTypes from 'prop-types';
import { ChannelContext } from '../../context';
import MessageSimple from './MessageSimple';
import {
  MESSAGE_ACTIONS,
  isUserMuted,
  getMessageActions,
  areMessagePropsEqual,
} from './utils';
import {
  useMuteHandler,
  useEditHandler,
  useReactionHandler,
  useDeleteHandler,
  useActionHandler,
  useRetryHandler,
  useMentionsHandler,
  useUserHandler,
  useOpenThreadHandler,
  useUserRole,
  useFlagHandler,
} from './hooks';

/**
 * Message - A high level component which implements all the logic required for a message.
 * The actual rendering of the message is delegated via the "Message" property
 *
 * @example ../../docs/Message.md
 * @type { React.FC<import('types').MessageComponentProps> }
 */
const Message = (props) => {
  const {
    addNotification,
    getFlagMessageErrorNotification,
    getFlagMessageSuccessNotification,
    getMuteUserErrorNotification,
    getMuteUserSuccessNotification,
    message,
    mutes,
    Message: MessageUIComponent = MessageSimple,
    messageActions = Object.keys(MESSAGE_ACTIONS),
    groupStyles = [],
    channel: propChannel,
    onUserClick: propOnUserClick,
    onUserHover: propOnUserHover,
    openThread: propOpenThread,
    retrySendMessage: propRetrySendMessage,
    onMentionsClick: propOnMentionsClick,
    onMentionsHover: propOnMentionsHover,
    setEditingState,
  } = props;
  const { channel: contextChannel } = useContext(ChannelContext);
  const channel = propChannel || contextChannel;
  const channelConfig = channel?.getConfig && channel.getConfig();
  const handleEdit = useEditHandler(message, setEditingState);
  const handleDelete = useDeleteHandler(message);
  const handleReaction = useReactionHandler(message);
  const handleAction = useActionHandler(message);
  const handleRetry = useRetryHandler(propRetrySendMessage);
  const handleOpenThread = useOpenThreadHandler(message, propOpenThread);
  const handleFlag = useFlagHandler(message, {
    notify: addNotification,
    getSuccessNotification: getFlagMessageSuccessNotification,
    getErrorNotification: getFlagMessageErrorNotification,
  });
  const handleMute = useMuteHandler(message, {
    notify: addNotification,
    getSuccessNotification: getMuteUserSuccessNotification,
    getErrorNotification: getMuteUserErrorNotification,
  });
  const { onMentionsClick, onMentionsHover } = useMentionsHandler(message, {
    onMentionsClick: propOnMentionsClick,
    onMentionsHover: propOnMentionsHover,
  });
  const { onUserClick, onUserHover } = useUserHandler(
    {
      onUserClickHandler: propOnUserClick,
      onUserHoverHandler: propOnUserHover,
    },
    message,
  );
  const isMuted = isUserMuted(message, mutes);
  const { isMyMessage, isAdmin, isModerator, isOwner } = useUserRole(message);
  const canEdit = isMyMessage || isModerator || isOwner || isAdmin;
  const canDelete = canEdit;
  const messageActionsHandler = useCallback(() => {
    if (!message || !messageActions) {
      return [];
    }

    return getMessageActions(messageActions, {
      canDelete,
      canEdit,
      canFlag: !isMyMessage,
      canMute: !isMyMessage && !!channelConfig?.mutes,
    });
  }, [channelConfig, message, messageActions, canDelete, canEdit, isMyMessage]);

  const actionsEnabled =
    message && message.type === 'regular' && message.status === 'received';

  return (
    MessageUIComponent && (
      <MessageUIComponent
        {...props}
        groupStyles={groupStyles}
        actionsEnabled={actionsEnabled}
        Message={MessageUIComponent}
        handleReaction={handleReaction}
        getMessageActions={messageActionsHandler}
        handleFlag={handleFlag}
        handleMute={handleMute}
        handleAction={handleAction}
        handleDelete={handleDelete}
        handleEdit={handleEdit}
        handleRetry={handleRetry}
        handleOpenThread={handleOpenThread}
        isUserMuted={() => isMuted}
        isMyMessage={() => isMyMessage}
        channelConfig={channelConfig}
        onMentionsClickMessage={onMentionsClick}
        onMentionsHoverMessage={onMentionsHover}
        onUserClick={onUserClick}
        onUserHover={onUserHover}
      />
    )
  );
};

Message.propTypes = {
  /** The message object */
  // @ts-ignore
  message: PropTypes.object.isRequired,
  /** The client connection object for connecting to Stream */
  // @ts-ignore
  client: PropTypes.object,
  /** The current channel this message is displayed in */
  // @ts-ignore
  channel: PropTypes.object,
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
  // @ts-ignore
  Message: PropTypes.elementType,
  /**
   * Attachment UI component to display attachment in individual message.
   * Available from [channel context](https://getstream.github.io/stream-chat-react/#channelcontext)
   * */
  // @ts-ignore
  Attachment: PropTypes.elementType,
  /** render HTML instead of markdown. Posting HTML is only allowed server-side */
  unsafeHTML: PropTypes.bool,
  /**
   * Array of allowed actions on message. e.g. ['edit', 'delete', 'mute', 'flag']
   * If all the actions need to be disabled, empty array or false should be provided as value of prop.
   * */
  // @ts-ignore
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
  // @ts-ignore
  messageListRect: PropTypes.object,
  /** @see See [Channel Context](https://getstream.github.io/stream-chat-react/#channelcontext) */
  // @ts-ignore
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
  // @ts-ignore
  MessageDeleted: PropTypes.elementType,
};
export default React.memo(Message, areMessagePropsEqual);
