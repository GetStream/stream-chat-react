// @ts-check
import React, { useContext, useRef } from 'react';
import PropTypes from 'prop-types';
import MessageRepliesCountButton from './MessageRepliesCountButton';
import { smartRender } from '../../utils';
import { TranslationContext, ChannelContext } from '../../context';
import { Attachment as DefaultAttachment } from '../Attachment';
import { Avatar as DefaultAvatar } from '../Avatar';
import { MML } from '../MML';
import { Modal } from '../Modal';
import {
  MessageInput,
  EditMessageForm as DefaultEditMessageForm,
} from '../MessageInput';
import { Tooltip } from '../Tooltip';
import { LoadingIndicator } from '../Loading';
import {
  ReactionsList as DefaultReactionList,
  ReactionSelector as DefaultReactionSelector,
} from '../Reactions';
import MessageOptions from './MessageOptions';
import MessageText from './MessageText';
import DefaultMessageDeleted from './MessageDeleted';
import {
  useActionHandler,
  useOpenThreadHandler,
  useReactionClick,
  useReactionHandler,
  useRetryHandler,
  useUserHandler,
  useUserRole,
} from './hooks';
import {
  areMessagePropsEqual,
  messageHasReactions,
  messageHasAttachments,
  getReadByTooltipText,
} from './utils';
import { DeliveredCheckIcon } from './icons';
import MessageTimestamp from './MessageTimestamp';

/**
 * MessageSimple - Render component, should be used together with the Message component
 *
 * @example ../../docs/MessageSimple.md
 * @type { React.FC<import('types').MessageSimpleProps> }
 */
// eslint-disable-next-line sonarjs/cognitive-complexity
const MessageSimple = (props) => {
  const {
    clearEditingState,
    editing,
    EditMessageInput = DefaultEditMessageForm,
    message,
    threadList,
    formatDate,
    updateMessage: propUpdateMessage,
    handleAction: propHandleAction,
    handleOpenThread: propHandleOpenThread,
    handleReaction: propHandleReaction,
    handleRetry: propHandleRetry,
    onUserClick: onUserClickCustomHandler,
    onUserHover: onUserHoverCustomHandler,
    tDateTimeParser: propTDateTimeParser,
  } = props;
  const { updateMessage: channelUpdateMessage } = useContext(ChannelContext);
  const updateMessage = propUpdateMessage || channelUpdateMessage;
  const { isMyMessage } = useUserRole(message);
  const handleOpenThread = useOpenThreadHandler(message);
  const handleReaction = useReactionHandler(message);
  const handleAction = useActionHandler(message);
  const handleRetry = useRetryHandler();
  const { onUserClick, onUserHover } = useUserHandler(message, {
    onUserClickHandler: onUserClickCustomHandler,
    onUserHoverHandler: onUserHoverCustomHandler,
  });
  const reactionSelectorRef = React.createRef();
  const messageWrapperRef = useRef(null);
  const {
    onReactionListClick,
    showDetailedReactions,
    isReactionEnabled,
  } = useReactionClick(message, reactionSelectorRef);
  const {
    Attachment = DefaultAttachment,
    Avatar = DefaultAvatar,
    MessageDeleted = DefaultMessageDeleted,
    ReactionSelector = DefaultReactionSelector,
    ReactionsList = DefaultReactionList,
  } = props;

  const hasReactions = messageHasReactions(message);
  const hasAttachment = messageHasAttachments(message);

  const messageClasses = isMyMessage
    ? 'str-chat__message str-chat__message--me str-chat__message-simple str-chat__message-simple--me'
    : 'str-chat__message str-chat__message-simple';

  if (message?.type === 'message.read' || message?.type === 'message.date') {
    return null;
  }

  if (message?.deleted_at) {
    return smartRender(MessageDeleted, { message }, null);
  }
  return (
    <React.Fragment>
      {editing && (
        <Modal open={editing} onClose={clearEditingState}>
          <MessageInput
            Input={EditMessageInput}
            message={message}
            clearEditingState={clearEditingState}
            updateMessage={updateMessage}
            {...props.additionalMessageInputProps}
          />
        </Modal>
      )}
      {message && (
        <div
          key={message.id || ''}
          className={`
						${messageClasses}
						str-chat__message--${message.type}
						str-chat__message--${message.status}
						${message.text ? 'str-chat__message--has-text' : 'has-no-text'}
						${hasAttachment ? 'str-chat__message--has-attachment' : ''}
						${hasReactions && isReactionEnabled ? 'str-chat__message--with-reactions' : ''}
					`.trim()}
          ref={messageWrapperRef}
        >
          <MessageSimpleStatus {...props} />

          {message.user && (
            <Avatar
              image={message.user.image}
              name={message.user.name || message.user.id}
              onClick={onUserClick}
              onMouseOver={onUserHover}
            />
          )}
          <div
            data-testid="message-inner"
            className="str-chat__message-inner"
            onClick={() => {
              if (
                message.status === 'failed' &&
                (propHandleRetry || handleRetry)
              ) {
                const retryHandler = propHandleRetry || handleRetry;
                // FIXME: type checking fails here because in the case of a failed message,
                // `message` is of type Client.Message (i.e. request object)
                // instead of Client.MessageResponse (i.e. server response object)
                // @ts-ignore
                retryHandler(message);
              }
            }}
          >
            {!message.text && (
              <React.Fragment>
                {
                  <MessageOptions
                    {...props}
                    messageWrapperRef={messageWrapperRef}
                    onReactionListClick={onReactionListClick}
                    handleOpenThread={propHandleOpenThread}
                  />
                }
                {/* if reactions show them */}
                {hasReactions &&
                  !showDetailedReactions &&
                  isReactionEnabled && (
                    <ReactionsList
                      reactions={message.latest_reactions}
                      reaction_counts={message.reaction_counts || undefined}
                      own_reactions={message.own_reactions}
                      onClick={onReactionListClick}
                      reverse={true}
                    />
                  )}
                {showDetailedReactions && isReactionEnabled && (
                  <ReactionSelector
                    handleReaction={propHandleReaction || handleReaction}
                    detailedView
                    reaction_counts={message.reaction_counts || undefined}
                    latest_reactions={message.latest_reactions}
                    own_reactions={message.own_reactions}
                    ref={reactionSelectorRef}
                  />
                )}
              </React.Fragment>
            )}

            {message?.attachments && Attachment && (
              <Attachment
                attachments={message.attachments}
                actionHandler={propHandleAction || handleAction}
              />
            )}

            {message.text && (
              <MessageText
                {...props}
                customOptionProps={{
                  messageWrapperRef,
                  handleOpenThread: propHandleOpenThread,
                }}
                // FIXME: There's some unmatched definition between the infered and the declared
                // ReactionSelector reference
                // @ts-ignore
                reactionSelectorRef={reactionSelectorRef}
              />
            )}

            {message.mml && (
              <MML
                source={message.mml}
                actionHandler={handleAction}
                align={isMyMessage ? 'right' : 'left'}
              />
            )}

            {!threadList && message.reply_count !== 0 && (
              <div className="str-chat__message-simple-reply-button">
                <MessageRepliesCountButton
                  onClick={propHandleOpenThread || handleOpenThread}
                  reply_count={message.reply_count}
                />
              </div>
            )}
            <div
              className={`str-chat__message-data str-chat__message-simple-data`}
            >
              {!isMyMessage && message.user ? (
                <span className="str-chat__message-simple-name">
                  {message.user.name || message.user.id}
                </span>
              ) : null}
              <MessageTimestamp
                customClass="str-chat__message-simple-timestamp"
                tDateTimeParser={propTDateTimeParser}
                formatDate={formatDate}
                message={message}
                calendar
              />
            </div>
          </div>
        </div>
      )}
    </React.Fragment>
  );
};

/** @type { React.FC<import('types').MessageSimpleProps> } */
const MessageSimpleStatus = ({
  Avatar = DefaultAvatar,
  readBy,
  message,
  threadList,
  lastReceivedId,
}) => {
  const { t } = useContext(TranslationContext);
  const { client } = useContext(ChannelContext);
  const { isMyMessage } = useUserRole(message);
  if (!isMyMessage || message?.type === 'error') {
    return null;
  }
  const justReadByMe =
    readBy &&
    readBy.length === 1 &&
    readBy[0] &&
    client &&
    readBy[0].id === client.user?.id;
  if (message && message.status === 'sending') {
    return (
      <span
        className="str-chat__message-simple-status"
        data-testid="message-status-sending"
      >
        <Tooltip>{t && t('Sending...')}</Tooltip>
        <LoadingIndicator />
      </span>
    );
  }
  if (readBy && readBy.length !== 0 && !threadList && !justReadByMe) {
    const lastReadUser = readBy.filter(
      /** @type {(item: import('stream-chat').UserResponse) => boolean} Typescript syntax */
      (item) => !!item && !!client && item.id !== client.user?.id,
    )[0];
    return (
      <span
        className="str-chat__message-simple-status"
        data-testid="message-status-read-by"
      >
        <Tooltip>{readBy && getReadByTooltipText(readBy, t, client)}</Tooltip>
        <Avatar
          name={lastReadUser?.name}
          image={lastReadUser?.image}
          size={15}
        />
        {readBy.length > 2 && (
          <span
            className="str-chat__message-simple-status-number"
            data-testid="message-status-read-by-many"
          >
            {readBy.length - 1}
          </span>
        )}
      </span>
    );
  }
  if (
    message &&
    message.status === 'received' &&
    message.id === lastReceivedId &&
    !threadList
  ) {
    return (
      <span
        className="str-chat__message-simple-status"
        data-testid="message-status-received"
      >
        <Tooltip>{t && t('Delivered')}</Tooltip>
        <DeliveredCheckIcon />
      </span>
    );
  }
  return null;
};

MessageSimple.propTypes = {
  /** The [message object](https://getstream.io/chat/docs/#message_format) */
  message: /** @type {PropTypes.Validator<import('stream-chat').MessageResponse>} */ (PropTypes
    .object.isRequired),
  /**
   * The attachment UI component.
   * Default: [Attachment](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment.js)
   * */
  Attachment: /** @type {PropTypes.Validator<React.ElementType<import('types').WrapperAttachmentUIComponentProps>>} */ (PropTypes.elementType),
  /**
   * Custom UI component to display user avatar
   *
   * Defaults to and accepts same props as: [Avatar](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Avatar/Avatar.js)
   * */
  Avatar: /** @type {PropTypes.Validator<React.ElementType<import('types').AvatarProps>>} */ (PropTypes.elementType),
  /**
   * Custom UI component to override default edit message input
   *
   * Defaults to and accepts same props as: [EditMessageForm](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/EditMessageForm.js)
   * */
  EditMessageInput: /** @type {PropTypes.Validator<React.FC<import("types").MessageInputProps>>} */ (PropTypes.elementType),
  /**
   * @deprecated Its not recommended to use this anymore. All the methods in this HOC are provided explicitly.
   *
   * The higher order message component, most logic is delegated to this component
   * @see See [Message HOC](https://getstream.github.io/stream-chat-react/#message) for example
   *
   * */
  Message: /** @type {PropTypes.Validator<React.ElementType<import('types').MessageUIComponentProps>>} */ (PropTypes.oneOfType(
    [PropTypes.node, PropTypes.func, PropTypes.object],
  )),
  /** render HTML instead of markdown. Posting HTML is only allowed server-side */
  unsafeHTML: PropTypes.bool,
  /** Client object */
  // @ts-ignore
  client: PropTypes.object,
  /** If its parent message in thread. */
  initialMessage: PropTypes.bool,
  /** Channel config object */
  channelConfig: /** @type {PropTypes.Validator<import('stream-chat').ChannelConfig>} */ (PropTypes.object),
  /** Override the default formatting of the date. This is a function that has access to the original date object. Returns a string or Node  */
  formatDate: PropTypes.func,
  /** If component is in thread list */
  threadList: PropTypes.bool,
  /**
   * Function to open thread on current message
   * @deprecated The component now relies on the useThreadHandler custom hook
   * You can customize the behaviour for your thread handler on the <Channel> component instead.
   */
  handleOpenThread: PropTypes.func,
  /** If the message is in edit state */
  editing: PropTypes.bool,
  /** Function to exit edit state */
  clearEditingState: PropTypes.func,
  /** Returns true if message belongs to current user */
  isMyMessage: PropTypes.func,
  /**
   * Returns all allowed actions on message by current user e.g., ['edit', 'delete', 'flag', 'mute', 'react', 'reply']
   * Please check [Message](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message.js) component for default implementation.
   * */
  getMessageActions: PropTypes.func.isRequired,
  /**
   * Function to publish updates on message to channel
   *
   * @param message Updated [message object](https://getstream.io/chat/docs/#message_format)
   * */
  updateMessage: PropTypes.func,
  /**
   * Reattempt sending a message
   * @param message A [message object](https://getstream.io/chat/docs/#message_format) to resent.
   * @deprecated This component now relies on the useRetryHandler custom hook.
   */
  handleRetry: PropTypes.func,
  /**
   * Add or remove reaction on message
   *
   * @param type Type of reaction - 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry'
   * @param event Dom event which triggered this function
   * @deprecated This component now relies on the useReactionHandler custom hook.
   */
  handleReaction: PropTypes.func,
  /**
   * A component to display the selector that allows a user to react to a certain message.
   */
  ReactionSelector: /** @type {PropTypes.Validator<React.ElementType<import('types').ReactionSelectorProps>>} */ (PropTypes.elementType),
  /**
   * A component to display the a message list of reactions.
   */
  ReactionsList: /** @type {PropTypes.Validator<React.ElementType<import('types').ReactionsListProps>>} */ (PropTypes.elementType),
  /** If actions such as edit, delete, flag, mute are enabled on message */
  actionsEnabled: PropTypes.bool,
  /** DOMRect object for parent MessageList component */
  messageListRect: PropTypes.shape({
    x: PropTypes.number.isRequired,
    y: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    width: PropTypes.number.isRequired,
    top: PropTypes.number.isRequired,
    right: PropTypes.number.isRequired,
    bottom: PropTypes.number.isRequired,
    left: PropTypes.number.isRequired,
    toJSON: PropTypes.func.isRequired,
  }),
  /**
   * @param name {string} Name of action
   * @param value {string} Value of action
   * @param event Dom event that triggered this handler
   * @deprecated This component now relies on the useActionHandler custom hook, and this prop will be removed on the next major release.
   */
  handleAction: PropTypes.func,
  /**
   * The handler for hover event on @mention in message
   *
   * @param event Dom hover event which triggered handler.
   * @param user Target user object
   * @deprecated This component now relies on the useMentionsHandler custom hook, and this prop will be removed on the next major release.
   * You can customize the behaviour for your mention handler on the <Channel> component instead.
   */
  onMentionsHoverMessage: PropTypes.func,
  /**
   * The handler for click event on @mention in message
   *
   * @param event Dom click event which triggered handler.
   * @param user Target user object
   * @deprecated This component now relies on the useMentionsHandler custom hook, and this prop will be removed on the next major release.
   * You can customize the behaviour for your mention handler on the <Channel> component instead.
   */
  onMentionsClickMessage: PropTypes.func,
  /**
   * The handler for click event on the user that posted the message
   *
   * @param event Dom click event which triggered handler.
   */
  onUserClick: PropTypes.func,
  /**
   * The handler for mouseOver event on the user that posted the message
   *
   * @param event Dom mouseOver event which triggered handler.
   */
  onUserHover: PropTypes.func,
  /**
   * Additional props for underlying MessageInput component.
   * Available props - https://getstream.github.io/stream-chat-react/#messageinput
   * */
  additionalMessageInputProps: PropTypes.object,
  /**
   * The component that will be rendered if the message has been deleted.
   * All of Message's props are passed into this component.
   */
  MessageDeleted: /** @type {PropTypes.Validator<React.ElementType<import('types').MessageDeletedProps>>} */ (PropTypes.elementType),
};

export default React.memo(MessageSimple, areMessagePropsEqual);
