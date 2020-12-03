// @ts-check
import React, {
  useCallback,
  useEffect,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import PropTypes from 'prop-types';

import MessageRepliesCountButton from './MessageRepliesCountButton';

import { isOnlyEmojis, renderText, smartRender } from '../../utils';
import { ChannelContext, TranslationContext } from '../../context';

import { Avatar as DefaultAvatar } from '../Avatar';
import { Attachment as DefaultAttachment } from '../Attachment';
import { MessageInput, EditMessageForm } from '../MessageInput';
import {
  SimpleReactionsList as DefaultReactionsList,
  ReactionSelector as DefaultReactionSelector,
} from '../Reactions';
import {
  useReactionHandler,
  useUserHandler,
  useRetryHandler,
  useOpenThreadHandler,
  useActionHandler,
  useReactionClick,
  useMentionsUIHandler,
  useEditHandler,
} from './hooks';
import { areMessagePropsEqual } from './utils';
import { MessageActions } from '../MessageActions';
import { ReactionIcon, ThreadIcon, ErrorIcon } from './icons';
import MessageTimestamp from './MessageTimestamp';

/**
 * MessageLivestream - Render component, should be used together with the Message component
 * Implements the look and feel for a livestream use case.
 *
 * @example ../../docs/MessageLivestream.md
 * @typedef { import('../../../types').MessageLivestreamProps } Props
 * @type { React.FC<Props> }
 */
// eslint-disable-next-line sonarjs/cognitive-complexity
const MessageLivestreamComponent = (props) => {
  const {
    message,
    groupStyles,
    editing: propEditing,
    setEditingState: propSetEdit,
    clearEditingState: propClearEdit,
    initialMessage,
    unsafeHTML,
    formatDate,
    channelConfig: propChannelConfig,
    ReactionsList = DefaultReactionsList,
    ReactionSelector = DefaultReactionSelector,
    onUserClick: propOnUserClick,
    handleReaction: propHandleReaction,
    handleOpenThread: propHandleOpenThread,
    onUserHover: propOnUserHover,
    handleRetry: propHandleRetry,
    handleAction: propHandleAction,
    updateMessage: propUpdateMessage,
    onMentionsClickMessage: propOnMentionsClick,
    onMentionsHoverMessage: propOnMentionsHover,
    Attachment = DefaultAttachment,
    Avatar = DefaultAvatar,
    t: propT,
    tDateTimeParser: propTDateTimeParser,
    MessageDeleted,
  } = props;
  const { t: contextT } = useContext(TranslationContext);
  const t = propT || contextT;
  const messageWrapperRef = useRef(null);
  const reactionSelectorRef = useRef(null);
  /**
   *@type {import('types').ChannelContextValue}
   */
  const { updateMessage: channelUpdateMessage, channel } = useContext(
    ChannelContext,
  );
  const channelConfig = propChannelConfig || channel?.getConfig();
  const { onMentionsClick, onMentionsHover } = useMentionsUIHandler(message, {
    onMentionsClick: propOnMentionsClick,
    onMentionsHover: propOnMentionsHover,
  });
  const handleAction = useActionHandler(message);
  const handleReaction = useReactionHandler(message);
  const handleOpenThread = useOpenThreadHandler(message);
  const {
    editing: ownEditing,
    setEdit: ownSetEditing,
    clearEdit: ownClearEditing,
  } = useEditHandler();
  const editing = propEditing || ownEditing;
  const setEdit = propSetEdit || ownSetEditing;
  const clearEdit = propClearEdit || ownClearEditing;
  const handleRetry = useRetryHandler();
  const retryHandler = propHandleRetry || handleRetry;
  const {
    onReactionListClick,
    showDetailedReactions,
    isReactionEnabled,
  } = useReactionClick(message, reactionSelectorRef, messageWrapperRef);
  const { onUserClick, onUserHover } = useUserHandler(message, {
    onUserClickHandler: propOnUserClick,
    onUserHoverHandler: propOnUserHover,
  });
  const messageTextItem = message?.text;
  const messageMentionedUsersItem = message?.mentioned_users;
  const messageText = useMemo(
    () => renderText(messageTextItem, messageMentionedUsersItem),
    [messageTextItem, messageMentionedUsersItem],
  );

  const firstGroupStyle = groupStyles ? groupStyles[0] : '';

  if (
    !message ||
    message.type === 'message.read' ||
    message.type === 'message.date'
  ) {
    return null;
  }

  if (message.deleted_at) {
    return smartRender(MessageDeleted, props, null);
  }
  if (editing) {
    return (
      <div
        data-testid={'message-livestream-edit'}
        className={`str-chat__message-team str-chat__message-team--${firstGroupStyle} str-chat__message-team--editing`}
      >
        {(firstGroupStyle === 'top' || firstGroupStyle === 'single') && (
          <div className="str-chat__message-team-meta">
            <Avatar
              image={message.user?.image}
              name={message.user?.name || message.user?.id}
              size={40}
              onClick={onUserClick}
              onMouseOver={onUserHover}
            />
          </div>
        )}
        <MessageInput
          Input={EditMessageForm}
          message={message}
          clearEditingState={clearEdit}
          updateMessage={propUpdateMessage || channelUpdateMessage}
        />
      </div>
    );
  }

  return (
    <React.Fragment>
      <div
        data-testid="message-livestream"
        className={`str-chat__message-livestream str-chat__message-livestream--${firstGroupStyle} str-chat__message-livestream--${
          message.type
        } str-chat__message-livestream--${message.status} ${
          initialMessage ? 'str-chat__message-livestream--initial-message' : ''
        }`}
        ref={messageWrapperRef}
      >
        {showDetailedReactions && isReactionEnabled && (
          <ReactionSelector
            reverse={false}
            handleReaction={handleReaction}
            detailedView
            latest_reactions={message?.latest_reactions}
            reaction_counts={message?.reaction_counts || undefined}
            own_reactions={message.own_reactions}
            ref={reactionSelectorRef}
          />
        )}
        <MessageLivestreamActions
          initialMessage={initialMessage}
          message={message}
          formatDate={formatDate}
          onReactionListClick={onReactionListClick}
          messageWrapperRef={messageWrapperRef}
          getMessageActions={props.getMessageActions}
          tDateTimeParser={propTDateTimeParser}
          channelConfig={channelConfig}
          threadList={props.threadList}
          addNotification={props.addNotification}
          handleOpenThread={propHandleOpenThread || handleOpenThread}
          setEditingState={setEdit}
        />
        <div className="str-chat__message-livestream-left">
          <Avatar
            image={message.user?.image}
            name={message.user?.name || message?.user?.id}
            size={30}
            onClick={onUserClick}
            onMouseOver={onUserHover}
          />
        </div>
        <div className="str-chat__message-livestream-right">
          <div className="str-chat__message-livestream-content">
            <div className="str-chat__message-livestream-author">
              <strong>{message.user?.name || message.user?.id}</strong>
              {message?.type === 'error' && (
                <div className="str-chat__message-team-error-header">
                  {t('Only visible to you')}
                </div>
              )}
            </div>

            <div
              data-testid="message-livestream-text"
              className={
                isOnlyEmojis(message.text)
                  ? 'str-chat__message-livestream-text--is-emoji'
                  : ''
              }
              onMouseOver={onMentionsHover}
              onClick={onMentionsClick}
            >
              {message.type !== 'error' &&
                message.status !== 'failed' &&
                !unsafeHTML &&
                messageText}

              {message.type !== 'error' &&
                message.status !== 'failed' &&
                unsafeHTML &&
                !!message.html && (
                  <div dangerouslySetInnerHTML={{ __html: message.html }} />
                )}

              {message.type === 'error' && !message.command && (
                <p data-testid="message-livestream-error">
                  <ErrorIcon />
                  {message.text}
                </p>
              )}

              {message.type === 'error' && message.command && (
                <p data-testid="message-livestream-command-error">
                  <ErrorIcon />
                  {/* TODO: Translate following sentence */}
                  <strong>/{message.command}</strong> is not a valid command
                </p>
              )}
              {message.status === 'failed' && (
                <p
                  onClick={() => {
                    if (retryHandler) {
                      // FIXME: type checking fails here because in the case of a failed message,
                      // `message` is of type Client.Message (i.e. request object)
                      // instead of Client.MessageResponse (i.e. server response object)
                      // @ts-ignore
                      retryHandler(message);
                    }
                  }}
                >
                  <ErrorIcon />
                  {t('Message failed. Click to try again.')}
                </p>
              )}
            </div>

            {message?.attachments && Attachment && (
              <Attachment
                attachments={message.attachments}
                actionHandler={propHandleAction || handleAction}
              />
            )}

            {isReactionEnabled && (
              <ReactionsList
                reaction_counts={message.reaction_counts || undefined}
                reactions={message.latest_reactions}
                own_reactions={message.own_reactions}
                handleReaction={propHandleReaction || handleReaction}
              />
            )}

            {!initialMessage && (
              <MessageRepliesCountButton
                onClick={propHandleOpenThread || handleOpenThread}
                reply_count={message.reply_count}
              />
            )}
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

/**
 * @type { React.FC<import('types').MessageLivestreamActionProps> }
 */
const MessageLivestreamActions = (props) => {
  const {
    initialMessage,
    message,
    channelConfig,
    threadList,
    formatDate,
    messageWrapperRef,
    onReactionListClick,
    getMessageActions,
    handleOpenThread,
    tDateTimeParser: propTDateTimeParser,
  } = props;
  const [actionsBoxOpen, setActionsBoxOpen] = useState(false);
  /** @type {() => void} Typescript syntax */
  const hideOptions = useCallback(() => setActionsBoxOpen(false), []);
  const messageDeletedAt = !!message?.deleted_at;
  const messageWrapper = messageWrapperRef?.current;
  useEffect(() => {
    if (messageWrapper) {
      messageWrapper.addEventListener('mouseleave', hideOptions);
    }

    return () => {
      if (messageWrapper) {
        messageWrapper.removeEventListener('mouseleave', hideOptions);
      }
    };
  }, [messageWrapper, hideOptions]);
  useEffect(() => {
    if (messageDeletedAt) {
      document.removeEventListener('click', hideOptions);
    }
  }, [messageDeletedAt, hideOptions]);

  useEffect(() => {
    if (actionsBoxOpen) {
      document.addEventListener('click', hideOptions);
    } else {
      document.removeEventListener('click', hideOptions);
    }
    return () => {
      document.removeEventListener('click', hideOptions);
    };
  }, [actionsBoxOpen, hideOptions]);

  if (
    initialMessage ||
    !message ||
    message.type === 'error' ||
    message.type === 'system' ||
    message.type === 'ephemeral' ||
    message.status === 'failed' ||
    message.status === 'sending'
  ) {
    return null;
  }

  return (
    <div
      data-testid={'message-livestream-actions'}
      className={`str-chat__message-livestream-actions`}
    >
      <MessageTimestamp
        customClass="str-chat__message-livestream-time"
        message={message}
        formatDate={formatDate}
        tDateTimeParser={propTDateTimeParser}
      />
      {channelConfig && channelConfig.reactions && (
        <span
          onClick={onReactionListClick}
          data-testid="message-livestream-reactions-action"
        >
          <span>
            <ReactionIcon />
          </span>
        </span>
      )}
      {!threadList && channelConfig && channelConfig.replies && (
        <span
          data-testid="message-livestream-thread-action"
          onClick={handleOpenThread}
        >
          <ThreadIcon />
        </span>
      )}
      <MessageActions
        {...props}
        getMessageActions={getMessageActions}
        customWrapperClass={''}
        inline
      />
    </div>
  );
};

MessageLivestreamComponent.propTypes = {
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
   *
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
  /** If its parent message in thread. */
  initialMessage: PropTypes.bool,

  /** Override the default formatting of the date. This is a function that has access to the original date object. Returns a string or Node  */
  formatDate: PropTypes.func,

  /** Channel config object */
  channelConfig: /** @type {PropTypes.Validator<import('stream-chat').ChannelConfig>} */ (PropTypes.object),
  /** If component is in thread list */
  threadList: PropTypes.bool,
  /** Function to open thread on current messxage */
  handleOpenThread: PropTypes.func,
  /** If the message is in edit state */
  editing: PropTypes.bool,
  /** Function to exit edit state */
  clearEditingState: PropTypes.func,
  /** Returns true if message belongs to current user */
  isMyMessage: PropTypes.func,
  /**
   * Returns all allowed actions on message by current user e.g., [edit, delete, flag, mute]
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
   */
  handleRetry: PropTypes.func,
  /**
   * Add or remove reaction on message
   *
   * @param type Type of reaction - 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry'
   * @param event Dom event which triggered this function
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
  /** @deprecated This property is no longer used * */
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
   */
  handleAction: PropTypes.func,
  /**
   * The handler for hover event on @mention in message
   *
   * @param event Dom hover event which triggered handler.
   * @param user Target user object
   */
  onMentionsHoverMessage: PropTypes.func,
  /**
   * The handler for click event on @mention in message
   *
   * @param event Dom click event which triggered handler.
   * @param user Target user object
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
   * The component that will be rendered if the message has been deleted.
   * All of Message's props are passed into this component.
   */
  MessageDeleted: /** @type {PropTypes.Validator<React.ElementType<import('types').MessageDeletedProps>>} */ (PropTypes.elementType),
};

export default React.memo(MessageLivestreamComponent, areMessagePropsEqual);
