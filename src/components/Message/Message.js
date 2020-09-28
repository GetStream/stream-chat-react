// @ts-check
import React, { useCallback, useContext } from 'react';
import PropTypes from 'prop-types';
import { ChannelContext } from '../../context';
import MessageSimple from './MessageSimple';
import { checkChannelPropType, checkClientPropType } from '../../utils';
import {
  MESSAGE_ACTIONS,
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
    channel: propChannel,
    onUserClick: propOnUserClick,
    onUserHover: propOnUserHover,
    openThread: propOpenThread,
    retrySendMessage: propRetrySendMessage,
    onMentionsClick: propOnMentionsClick,
    onMentionsHover: propOnMentionsHover,
    Message: MessageUIComponent = MessageSimple,
    messageActions = Object.keys(MESSAGE_ACTIONS),
    formatDate,
    groupStyles = [],
  } = props;
  const { channel: contextChannel } = useContext(ChannelContext);
  const channel = propChannel || contextChannel;
  const channelConfig = channel?.getConfig && channel.getConfig();
  const { editing, setEdit, clearEdit } = useEditHandler();
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
  const { onUserClick, onUserHover } = useUserHandler(message, {
    onUserClickHandler: propOnUserClick,
    onUserHoverHandler: propOnUserHover,
  });
  const { isMyMessage, isAdmin, isModerator, isOwner } = useUserRole(message);
  const canReact = true;
  const canReply = true;
  const canEdit = isMyMessage || isModerator || isOwner || isAdmin;
  const canDelete = canEdit;
  const messageActionsHandler = useCallback(() => {
    if (!message || !messageActions) {
      return [];
    }

    return getMessageActions(messageActions, {
      canDelete,
      canEdit,
      canReply,
      canReact,
      canFlag: !isMyMessage,
      canMute: !isMyMessage && !!channelConfig?.mutes,
    });
  }, [
    channelConfig,
    message,
    messageActions,
    canDelete,
    canEdit,
    canReply,
    canReact,
    isMyMessage,
  ]);

  const actionsEnabled =
    message && message.type === 'regular' && message.status === 'received';

  return (
    MessageUIComponent && (
      <MessageUIComponent
        {...props}
        editing={editing}
        formatDate={formatDate}
        clearEditingState={clearEdit}
        setEditingState={setEdit}
        groupStyles={groupStyles}
        actionsEnabled={actionsEnabled}
        Message={MessageUIComponent}
        handleReaction={handleReaction}
        getMessageActions={messageActionsHandler}
        handleFlag={handleFlag}
        handleMute={handleMute}
        handleAction={handleAction}
        handleDelete={handleDelete}
        handleEdit={setEdit}
        handleRetry={handleRetry}
        handleOpenThread={handleOpenThread}
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
  message: /** @type {PropTypes.Validator<import('stream-chat').MessageResponse>} */ (PropTypes.shape(
    {
      text: PropTypes.string.isRequired,
      html: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      reaction_counts: PropTypes.objectOf(PropTypes.number.isRequired),
      reaction_scores: PropTypes.objectOf(PropTypes.number.isRequired),
      created_at: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
      updated_at: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    },
  ).isRequired),
  /** The client connection object for connecting to Stream */
  client: /** @type {PropTypes.Validator<import('types').StreamChatReactClient>} */ (PropTypes.objectOf(
    checkClientPropType,
  ).isRequired),
  /** The current channel this message is displayed in */
  channel: /** @type {PropTypes.Validator<ReturnType<import('types').StreamChatReactClient['channel']>>} */ (PropTypes.objectOf(
    checkChannelPropType,
  ).isRequired),
  /** A list of users that have read this message */
  readBy: PropTypes.array,
  /** groupStyles, a list of styles to apply to this message. ie. top, bottom, single etc */
  groupStyles: PropTypes.array,

  /** Override the default formatting of the date. This is a function that has access to the original date object. Returns a string or Node  */
  formatDate: PropTypes.func,
  /**
   * Message UI component to display a message in message list.
   * Available from [channel context](https://getstream.github.io/stream-chat-react/#channelcontext)
   * */
  Message: /** @type {PropTypes.Validator<React.ElementType<import('types').MessageUIComponentProps>>} */ (PropTypes.elementType),
  /**
   * The component that will be rendered if the message has been deleted.
   * All props are passed into this component.
   */
  MessageDeleted: /** @type {PropTypes.Validator<React.ElementType<import('types').MessageDeletedProps>>} */ (PropTypes.elementType),

  /**
   * A component to display the selector that allows a user to react to a certain message.
   */
  ReactionSelector: /** @type {PropTypes.Validator<React.ElementType<import('types').ReactionSelectorProps>>} */ (PropTypes.elementType),
  /**
   * A component to display the a message list of reactions.
   */
  ReactionsList: /** @type {PropTypes.Validator<React.ElementType<import('types').ReactionsListProps>>} */ (PropTypes.elementType),
  /**
   * Attachment UI component to display attachment in individual message.
   * Available from [channel context](https://getstream.github.io/stream-chat-react/#channelcontext)
   * */
  Attachment: /** @type {PropTypes.Validator<React.ElementType<import('types').WrapperAttachmentUIComponentProps>>} */ (PropTypes.elementType),
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
  messageListRect: /** @type {PropTypes.Validator<DOMRect>} */ (PropTypes.object),
  /** @see See [Channel Context](https://getstream.github.io/stream-chat-react/#channelcontext) */
  members: /** @type {PropTypes.Validator<import('seamless-immutable').ImmutableObject<{[user_id: string]: import('stream-chat').ChannelMemberResponse<import('types').StreamChatReactUserType>}> | null | undefined>} */ (PropTypes.object),
  /**
   * Function to add custom notification on messagelist
   *
   * @param text Notification text to display
   * @param type Type of notification. 'success' | 'error'
   * */
  addNotification: PropTypes.func,
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
  /**
   * Additional props for underlying MessageInput component.
   * Available props - https://getstream.github.io/stream-chat-react/#messageinput
   * */
  additionalMessageInputProps: PropTypes.object,
};

Message.defaultProps = {
  Message: MessageSimple,
  readBy: [],
  groupStyles: [],
  messageActions: Object.keys(MESSAGE_ACTIONS),
};

export default React.memo(Message, areMessagePropsEqual);
