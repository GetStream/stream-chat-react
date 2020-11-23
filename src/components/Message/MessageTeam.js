// @ts-check
import React, { useMemo, useContext, useRef } from 'react';
import PropTypes from 'prop-types';

import MessageRepliesCountButton from './MessageRepliesCountButton';
import { isOnlyEmojis, renderText, smartRender } from '../../utils';
import { ChannelContext, TranslationContext } from '../../context';
import { Attachment as DefaultAttachment } from '../Attachment';
import { Avatar } from '../Avatar';
import { MessageInput, EditMessageForm } from '../MessageInput';
import { MessageActions } from '../MessageActions';
import { Tooltip } from '../Tooltip';
import { LoadingIndicator } from '../Loading';
import {
  SimpleReactionsList as DefaultReactionsList,
  ReactionSelector as DefaultReactionSelector,
} from '../Reactions';
import {
  useUserRole,
  useActionHandler,
  useUserHandler,
  useReactionClick,
  useRetryHandler,
  useReactionHandler,
  useOpenThreadHandler,
  useMentionsUIHandler,
  useEditHandler,
} from './hooks';
import { areMessagePropsEqual, getReadByTooltipText } from './utils';
import {
  ReactionIcon,
  ThreadIcon,
  ErrorIcon,
  DeliveredCheckIcon,
} from './icons';
import MessageTimestamp from './MessageTimestamp';

/**
 * MessageTeam - Render component, should be used together with the Message component
 * Implements the look and feel for a team style collaboration environment
 *
 * @example ../../docs/MessageTeam.md
 * @typedef { import('types').MessageTeamProps } Props
 *
 * @type {React.FC<Props>}
 */
// eslint-disable-next-line sonarjs/cognitive-complexity
const MessageTeam = (props) => {
  const {
    message,
    threadList,
    formatDate,
    initialMessage,
    unsafeHTML,
    getMessageActions,
    MessageDeleted,
    ReactionsList = DefaultReactionsList,
    ReactionSelector = DefaultReactionSelector,
    editing: propEditing,
    setEditingState: propSetEdit,
    clearEditingState: propClearEdit,
    onMentionsHoverMessage: propOnMentionsHover,
    onMentionsClickMessage: propOnMentionsClick,
    channelConfig: propChannelConfig,
    handleAction: propHandleAction,
    handleOpenThread: propHandleOpenThread,
    handleReaction: propHandleReaction,
    handleRetry: propHandleRetry,
    updateMessage: propUpdateMessage,
    onUserClick: propOnUserClick,
    onUserHover: propOnUserHover,
    t: propT,
  } = props;

  /**
   *@type {import('types').ChannelContextValue}
   */
  const { channel, updateMessage: channelUpdateMessage } = useContext(
    ChannelContext,
  );
  const channelConfig = propChannelConfig || channel?.getConfig();
  const { t: contextT } = useContext(TranslationContext);
  const t = propT || contextT;
  const groupStyles = props.groupStyles || ['single'];
  const reactionSelectorRef = useRef(null);
  const messageWrapperRef = useRef(null);
  const {
    editing: ownEditing,
    setEdit: ownSetEditing,
    clearEdit: ownClearEditing,
  } = useEditHandler();
  const editing = propEditing || ownEditing;
  const setEdit = propSetEdit || ownSetEditing;
  const clearEdit = propClearEdit || ownClearEditing;
  const handleOpenThread = useOpenThreadHandler(message);
  const handleReaction = useReactionHandler(message);
  const retryHandler = useRetryHandler();
  const retry = propHandleRetry || retryHandler;
  const { onMentionsClick, onMentionsHover } = useMentionsUIHandler(message, {
    onMentionsClick: propOnMentionsClick,
    onMentionsHover: propOnMentionsHover,
  });
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

  if (message?.type === 'message.read') {
    return null;
  }

  if (message?.deleted_at) {
    return smartRender(MessageDeleted, props, null);
  }

  if (editing) {
    return (
      <div
        data-testid="message-team-edit"
        className={`str-chat__message-team str-chat__message-team--${firstGroupStyle} str-chat__message-team--editing`}
      >
        {(firstGroupStyle === 'top' || firstGroupStyle === 'single') && (
          <div className="str-chat__message-team-meta">
            <Avatar
              image={message?.user?.image}
              name={message?.user?.name || message?.user?.id}
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
        data-testid="message-team"
        className={`str-chat__message-team str-chat__message-team--${firstGroupStyle} str-chat__message-team--${
          message?.type
        } ${threadList ? 'thread-list' : ''} str-chat__message-team--${
          message?.status
        }`}
        ref={messageWrapperRef}
      >
        <div className="str-chat__message-team-meta">
          {firstGroupStyle === 'top' ||
          firstGroupStyle === 'single' ||
          initialMessage ? (
            <Avatar
              image={message?.user?.image}
              name={message?.user?.name || message?.user?.id}
              size={40}
              onClick={onUserClick}
              onMouseOver={onUserHover}
            />
          ) : (
            <div
              data-testid="team-meta-spacer"
              style={{ width: 40, marginRight: 0 }}
            />
          )}
          <MessageTimestamp
            message={message}
            tDateTimeParser={props.tDateTimeParser}
            formatDate={formatDate}
          />
        </div>
        <div className="str-chat__message-team-group">
          {message &&
            (firstGroupStyle === 'top' ||
              firstGroupStyle === 'single' ||
              initialMessage) && (
              <div
                data-testid="message-team-author"
                className="str-chat__message-team-author"
                onClick={onUserClick}
              >
                <strong>{message.user?.name || message.user?.id}</strong>
                {message.type === 'error' && (
                  <div className="str-chat__message-team-error-header">
                    {t('Only visible to you')}
                  </div>
                )}
              </div>
            )}
          <div
            data-testid="message-team-content"
            className={`str-chat__message-team-content str-chat__message-team-content--${firstGroupStyle} str-chat__message-team-content--${
              message?.text === '' ? 'image' : 'text'
            }`}
          >
            {!initialMessage &&
              message &&
              message.status !== 'sending' &&
              message.status !== 'failed' &&
              message.type !== 'system' &&
              message.type !== 'ephemeral' &&
              message.type !== 'error' && (
                <div
                  data-testid="message-team-actions"
                  className={`str-chat__message-team-actions`}
                >
                  {message && showDetailedReactions && (
                    <ReactionSelector
                      handleReaction={propHandleReaction || handleReaction}
                      latest_reactions={message.latest_reactions}
                      reaction_counts={message.reaction_counts || undefined}
                      own_reactions={message.own_reactions}
                      detailedView={true}
                      ref={reactionSelectorRef}
                    />
                  )}

                  {isReactionEnabled && (
                    <span
                      data-testid="message-team-reaction-icon"
                      title="Reactions"
                      onClick={onReactionListClick}
                    >
                      <ReactionIcon />
                    </span>
                  )}
                  {!threadList && channelConfig?.replies !== false && (
                    <span
                      data-testid="message-team-thread-icon"
                      title="Start a thread"
                      onClick={propHandleOpenThread || handleOpenThread}
                    >
                      <ThreadIcon />
                    </span>
                  )}
                  {message &&
                    getMessageActions &&
                    getMessageActions().length > 0 && (
                      <MessageActions
                        addNotification={props.addNotification}
                        message={message}
                        getMessageActions={props.getMessageActions}
                        messageListRect={props.messageListRect}
                        messageWrapperRef={messageWrapperRef}
                        setEditingState={setEdit}
                        getMuteUserSuccessNotification={
                          props.getMuteUserSuccessNotification
                        }
                        getMuteUserErrorNotification={
                          props.getMuteUserErrorNotification
                        }
                        getFlagMessageErrorNotification={
                          props.getFlagMessageErrorNotification
                        }
                        getFlagMessageSuccessNotification={
                          props.getFlagMessageSuccessNotification
                        }
                        handleFlag={props.handleFlag}
                        handleMute={props.handleMute}
                        handleEdit={props.handleEdit}
                        handleDelete={props.handleDelete}
                        customWrapperClass={''}
                        inline
                      />
                    )}
                </div>
              )}
            {message && (
              <span
                data-testid="message-team-message"
                className={
                  isOnlyEmojis(message.text)
                    ? 'str-chat__message-team-text--is-emoji'
                    : ''
                }
                onMouseOver={onMentionsHover}
                onClick={onMentionsClick}
              >
                {unsafeHTML && message.html ? (
                  <div dangerouslySetInnerHTML={{ __html: message.html }} />
                ) : (
                  messageText
                )}
              </span>
            )}

            {message && message.text === '' && (
              <MessageTeamAttachments
                Attachment={props.Attachment}
                message={message}
                handleAction={propHandleAction}
              />
            )}

            {message?.latest_reactions &&
              message.latest_reactions.length !== 0 &&
              message.text !== '' &&
              isReactionEnabled && (
                <ReactionsList
                  reaction_counts={message.reaction_counts || undefined}
                  handleReaction={propHandleReaction || handleReaction}
                  reactions={message.latest_reactions}
                  own_reactions={message.own_reactions}
                />
              )}
            {message?.status === 'failed' && (
              <button
                data-testid="message-team-failed"
                className="str-chat__message-team-failed"
                onClick={() => {
                  if (message.status === 'failed' && retry) {
                    // FIXME: type checking fails here because in the case of a failed message,
                    // `message` is of type Client.Message (i.e. request object)
                    // instead of Client.MessageResponse (i.e. server response object)
                    // @ts-ignore
                    retry(message);
                  }
                }}
              >
                <ErrorIcon />
                {t('Message failed. Click to try again.')}
              </button>
            )}
          </div>
          <MessageTeamStatus
            readBy={props.readBy}
            message={message}
            threadList={threadList}
            lastReceivedId={props.lastReceivedId}
            t={propT}
          />
          {message && message.text !== '' && message.attachments && (
            <MessageTeamAttachments
              Attachment={props.Attachment}
              message={message}
              handleAction={propHandleAction}
            />
          )}
          {message?.latest_reactions &&
            message.latest_reactions.length !== 0 &&
            message.text === '' &&
            isReactionEnabled && (
              <ReactionsList
                reaction_counts={message.reaction_counts || undefined}
                handleReaction={propHandleReaction || handleReaction}
                reactions={message.latest_reactions}
                own_reactions={message.own_reactions}
              />
            )}
          {!threadList && message && (
            <MessageRepliesCountButton
              onClick={propHandleOpenThread || handleOpenThread}
              reply_count={message.reply_count}
            />
          )}
        </div>
      </div>
    </React.Fragment>
  );
};

/** @type {(props: import('types').MessageTeamStatusProps) => React.ReactElement | null} */
const MessageTeamStatus = (props) => {
  const { readBy, message, threadList, lastReceivedId, t: propT } = props;
  const { client } = useContext(ChannelContext);
  const { t: contextT } = useContext(TranslationContext);
  const t = propT || contextT;
  const { isMyMessage } = useUserRole(message);
  if (!isMyMessage || message?.type === 'error') {
    return null;
  }
  const justReadByMe =
    readBy &&
    client?.user &&
    readBy.length === 1 &&
    readBy[0] &&
    readBy[0].id === client.user.id;
  if (message && message.status === 'sending') {
    return (
      <span
        className="str-chat__message-team-status"
        data-testid="message-team-sending"
      >
        <Tooltip>{t && t('Sending...')}</Tooltip>
        <LoadingIndicator />
      </span>
    );
  }

  if (readBy && readBy.length !== 0 && !threadList && !justReadByMe) {
    const lastReadUser = readBy.filter(
      (item) => item && client?.user && item.id !== client.user.id,
    )[0];
    return (
      <span className="str-chat__message-team-status">
        <Tooltip>{getReadByTooltipText(readBy, t, client)}</Tooltip>
        <Avatar
          name={lastReadUser?.name}
          image={lastReadUser?.image}
          size={15}
        />
        {readBy.length - 1 > 1 && (
          <span
            data-testid="message-team-read-by-count"
            className="str-chat__message-team-status-number"
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
        data-testid="message-team-received"
        className="str-chat__message-team-status"
      >
        <Tooltip>{t && t('Delivered')}</Tooltip>
        <DeliveredCheckIcon />
      </span>
    );
  }

  return null;
};

/** @type {(props: import('types').MessageTeamAttachmentsProps) => React.ReactElement | null} Typescript syntax */
const MessageTeamAttachments = (props) => {
  const {
    Attachment = DefaultAttachment,
    message,
    handleAction: propHandleAction,
  } = props;
  const handleAction = useActionHandler(message);
  if (message?.attachments && Attachment) {
    return (
      <Attachment
        attachments={message.attachments}
        actionHandler={propHandleAction || handleAction}
      />
    );
  }
  return null;
};

MessageTeam.propTypes = {
  /** The [message object](https://getstream.io/chat/docs/#message_format) */
  message: /** @type {PropTypes.Validator<import('stream-chat').MessageResponse>} */ (PropTypes
    .object.isRequired),
  /**
   * The attachment UI component.
   * Default: [Attachment](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment.js)
   * */
  Attachment: /** @type {PropTypes.Validator<React.ElementType<import('types').WrapperAttachmentUIComponentProps>>} */ (PropTypes.elementType),
  /**
   *
   * @deprecated Its not recommended to use this anymore. All the methods in this HOC are provided explicitly.
   *
   * The higher order message component, most logic is delegated to this component
   * @see See [Message HOC](https://getstream.github.io/stream-chat-react/#message) for example
   * */
  Message: /** @type {PropTypes.Validator<React.ElementType<import('types').MessageUIComponentProps>>} */ (PropTypes.oneOfType(
    [PropTypes.node, PropTypes.func, PropTypes.object],
  )),
  /** render HTML instead of markdown. Posting HTML is only allowed server-side */
  unsafeHTML: PropTypes.bool,
  /** Client object */
  client: /** @type {PropTypes.Validator<import('stream-chat').StreamChat>} */ (PropTypes.object),
  /** If its parent message in thread. */
  initialMessage: PropTypes.bool,
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

  /** Override the default formatting of the date. This is a function that has access to the original date object. Returns a string or Node  */
  formatDate: PropTypes.func,
  /**
   * Returns all allowed actions on message by current user e.g., [edit, delete, flag, mute]
   * Please check [Message](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message.js) component for default implementation.
   * */
  getMessageActions: /** @type {PropTypes.Validator<() => Array<string>>} */ (PropTypes.func),
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
  /** DOMRect object for parent MessageList component */
  messageListRect: /** @type {PropTypes.Validator<DOMRect>} */ (PropTypes.object),
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
  /** Position of message in group. Possible values: top, bottom, middle, single */
  groupStyles: PropTypes.array,
  /**
   * The component that will be rendered if the message has been deleted.
   * All of Message's props are passed into this component.
   */
  MessageDeleted: /** @type {PropTypes.Validator<React.ElementType<import('types').MessageDeletedProps>>} */ (PropTypes.elementType),
};

export default React.memo(MessageTeam, areMessagePropsEqual);
