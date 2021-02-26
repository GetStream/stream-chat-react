import React, { useCallback, useContext } from 'react';
import PropTypes from 'prop-types';

import { MessageSimple } from './MessageSimple';
import {
  useActionHandler,
  useDeleteHandler,
  useEditHandler,
  useFlagHandler,
  useMentionsHandler,
  useMuteHandler,
  useOpenThreadHandler,
  usePinHandler,
  useReactionHandler,
  useRetryHandler,
  useUserHandler,
  useUserRole,
} from './hooks';
import {
  areMessagePropsEqual,
  defaultPinPermissions,
  getMessageActions,
  MESSAGE_ACTIONS,
} from './utils';

import { ChannelContext } from '../../context';
import { checkChannelPropType, checkClientPropType } from '../../utils';

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
    channel: propChannel,
    formatDate,
    getFlagMessageErrorNotification,
    getFlagMessageSuccessNotification,
    getMuteUserErrorNotification,
    getMuteUserSuccessNotification,
    getPinMessageErrorNotification,
    groupStyles = [],
    Message: MessageUIComponent = MessageSimple,
    message,
    messageActions = Object.keys(MESSAGE_ACTIONS),
    onMentionsClick: propOnMentionsClick,
    onMentionsHover: propOnMentionsHover,
    onUserClick: propOnUserClick,
    onUserHover: propOnUserHover,
    openThread: propOpenThread,
    pinPermissions = defaultPinPermissions,
    retrySendMessage: propRetrySendMessage,
  } = props;

  const { channel: contextChannel } = useContext(ChannelContext);

  const channel = propChannel || contextChannel;
  const channelConfig = channel?.getConfig && channel.getConfig();

  const handleAction = useActionHandler(message);
  const handleDelete = useDeleteHandler(message);
  const { clearEdit, editing, setEdit } = useEditHandler();
  const handleOpenThread = useOpenThreadHandler(message, propOpenThread);
  const handleReaction = useReactionHandler(message);
  const handleRetry = useRetryHandler(propRetrySendMessage);

  const handleFlag = useFlagHandler(message, {
    getErrorNotification: getFlagMessageErrorNotification,
    getSuccessNotification: getFlagMessageSuccessNotification,
    notify: addNotification,
  });

  const handleMute = useMuteHandler(message, {
    getErrorNotification: getMuteUserErrorNotification,
    getSuccessNotification: getMuteUserSuccessNotification,
    notify: addNotification,
  });

  const { onMentionsClick, onMentionsHover } = useMentionsHandler(message, {
    onMentionsClick: propOnMentionsClick,
    onMentionsHover: propOnMentionsHover,
  });

  const { canPin, handlePin } = usePinHandler(message, pinPermissions, {
    getErrorNotification: getPinMessageErrorNotification,
    notify: addNotification,
  });

  const { onUserClick, onUserHover } = useUserHandler(message, {
    onUserClickHandler: propOnUserClick,
    onUserHoverHandler: propOnUserHover,
  });

  const { isAdmin, isModerator, isMyMessage, isOwner } = useUserRole(message);

  const canEdit = isMyMessage || isModerator || isOwner || isAdmin;
  const canDelete = canEdit;
  const canReact = true;
  const canReply = true;

  const messageActionsHandler = useCallback(() => {
    if (!message || !messageActions) {
      return [];
    }

    return getMessageActions(messageActions, {
      canDelete,
      canEdit,
      canFlag: !isMyMessage,
      canMute: !isMyMessage && !!channelConfig?.mutes,
      canPin,
      canReact,
      canReply,
    });
  }, [
    canDelete,
    canEdit,
    canPin,
    canReply,
    canReact,
    channelConfig?.mutes,
    isMyMessage,
    message,
    messageActions,
  ]);

  const actionsEnabled =
    message && message.type === 'regular' && message.status === 'received';

  return (
    MessageUIComponent && (
      <MessageUIComponent
        {...props}
        actionsEnabled={actionsEnabled}
        channelConfig={channelConfig}
        clearEditingState={clearEdit}
        editing={editing}
        formatDate={formatDate}
        getMessageActions={messageActionsHandler}
        groupStyles={groupStyles}
        handleAction={handleAction}
        handleDelete={handleDelete}
        handleEdit={setEdit}
        handleFlag={handleFlag}
        handleMute={handleMute}
        handleOpenThread={handleOpenThread}
        handlePin={handlePin}
        handleReaction={handleReaction}
        handleRetry={handleRetry}
        isMyMessage={() => isMyMessage}
        Message={MessageUIComponent}
        onMentionsClickMessage={onMentionsClick}
        onMentionsHoverMessage={onMentionsHover}
        onUserClick={onUserClick}
        onUserHover={onUserHover}
        setEditingState={setEdit}
      />
    )
  );
};

Message.propTypes = {
  /**
   * Additional props for underlying MessageInput component.
   * Available props - https://getstream.github.io/stream-chat-react/#messageinput
   * */
  additionalMessageInputProps: PropTypes.object,
  /**
   * Function to add custom notification on message list
   *
   * @param text Notification text to display
   * @param type Type of notification. 'success' | 'error'
   * */
  addNotification: PropTypes.func,
  /**
   * Attachment UI component to display attachment in individual message.
   * Available from [channel context](https://getstream.github.io/stream-chat-react/#channelcontext)
   * */
  Attachment: /** @type {PropTypes.Validator<React.ElementType<import('types').WrapperAttachmentUIComponentProps>>} */ (PropTypes.elementType),
  /**
   * Custom UI component to display user avatar
   *
   * Defaults to and accepts same props as: [Avatar](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Avatar/Avatar.js)
   * */
  Avatar: /** @type {PropTypes.Validator<React.ElementType<import('types').AvatarProps>>} */ (PropTypes.elementType),
  /** The current channel this message is displayed in */
  channel: /** @type {PropTypes.Validator<ReturnType<import('types').StreamChatReactClient['channel']>>} */ (PropTypes.objectOf(
    checkChannelPropType,
  )),
  /** The client connection object for connecting to Stream */
  client: /** @type {PropTypes.Validator<import('types').StreamChatReactClient>} */ (PropTypes.objectOf(
    checkClientPropType,
  )),
  /** Override the default formatting of the date. This is a function that has access to the original date object. Returns a string or Node  */
  formatDate: PropTypes.func,
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
   * Function that returns message/text as string to be shown as notification, when request for flagging a message is successful
   *
   * This function should accept following params:
   *
   * @param message A [message object](https://getstream.io/chat/docs/#message_format) which is flagged.
   *
   * */
  getFlagMessageSuccessNotification: PropTypes.func,
  /**
   * Function that returns message/text as string to be shown as notification, when request for muting a user runs into error
   *
   * This function should accept following params:
   *
   * @param user A user object which is being muted
   *
   * */
  getMuteUserErrorNotification: PropTypes.func,
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
   * Function that returns message/text as string to be shown as notification, when request for pinning a message runs into error
   *
   * This function should accept following params:
   *
   * @param message A [message object](https://getstream.io/chat/docs/#message_format)
   *
   * */
  getPinMessageErrorNotification: PropTypes.func,
  /** groupStyles, a list of styles to apply to this message. ie. top, bottom, single etc */
  groupStyles: PropTypes.array,
  /** Latest message id on current channel */
  lastReceivedId: PropTypes.string,
  /** @see See [Channel Context](https://getstream.github.io/stream-chat-react/#channelcontext) */
  members: /** @type {PropTypes.Validator<{[user_id: string]: import('stream-chat').ChannelMemberResponse<import('types').StreamChatReactUserType>} | null | undefined>} */ (PropTypes.object),
  /** The message object */
  message: /** @type {PropTypes.Validator<import('stream-chat').MessageResponse>} */ (PropTypes.shape(
    {
      created_at: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
      html: PropTypes.string.isRequired,
      reaction_counts: PropTypes.objectOf(PropTypes.number.isRequired),
      reaction_scores: PropTypes.objectOf(PropTypes.number.isRequired),
      text: PropTypes.string.isRequired,
      type: PropTypes.string.isRequired,
      updated_at: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    },
  ).isRequired),
  /**
   * Message UI component to display a message in message list.
   * Available from [channel context](https://getstream.github.io/stream-chat-react/#channelcontext)
   * */
  Message: /** @type {PropTypes.Validator<React.ElementType<import('types').MessageUIComponentProps>>} */ (PropTypes.elementType),
  /**
   * Array of allowed actions on message. e.g. ['edit', 'delete', 'flag', 'mute', 'react', 'reply']
   * If all the actions need to be disabled, empty array or false should be provided as value of prop.
   * */
  messageActions: PropTypes.oneOfType([PropTypes.bool, PropTypes.array]),
  /**
   * The component that will be rendered if the message has been deleted.
   * All props are passed into this component.
   */
  MessageDeleted: /** @type {PropTypes.Validator<React.ElementType<import('types').MessageDeletedProps>>} */ (PropTypes.elementType),
  /** DOMRect object for parent MessageList component */
  messageListRect: /** @type {PropTypes.Validator<DOMRect>} */ (PropTypes.object),
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
   * The user roles allowed to pin messages in various channel types
   */
  pinPermissions: /** @type {PropTypes.Validator<import('types').PinPermissions>>} */ (PropTypes.object),
  /**
   * A component to display the selector that allows a user to react to a certain message.
   */
  ReactionSelector: /** @type {PropTypes.Validator<React.ElementType<import('types').ReactionSelectorProps>>} */ (PropTypes.elementType),
  /**
   * A component to display the a message list of reactions.
   */
  ReactionsList: /** @type {PropTypes.Validator<React.ElementType<import('types').ReactionsListProps>>} */ (PropTypes.elementType),
  /** A list of users that have read this message */
  readBy: PropTypes.array,
  /** @see See [Channel Context](https://getstream.github.io/stream-chat-react/#channelcontext) */
  removeMessage: PropTypes.func,
  /** @see See [Channel Context](https://getstream.github.io/stream-chat-react/#channelcontext) */
  retrySendMessage: PropTypes.func,
  /** render HTML instead of markdown. Posting HTML is only allowed server-side */
  unsafeHTML: PropTypes.bool,
  /** @see See [Channel Context](https://getstream.github.io/stream-chat-react/#channelcontext) */
  updateMessage: PropTypes.func,
};

Message.defaultProps = {
  readBy: [],
};

export default React.memo(Message, areMessagePropsEqual);
