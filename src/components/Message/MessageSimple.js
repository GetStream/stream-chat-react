// @ts-check
import React, { useCallback, useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import MessageRepliesCountButton from './MessageRepliesCountButton';
import {
  isOnlyEmojis,
  renderText,
  getReadByTooltipText,
  smartRender,
} from '../../utils';
import { TranslationContext, ChannelContext } from '../../context';
import { Attachment as DefaultAttachment } from '../Attachment';
import { Avatar } from '../Avatar';
import { Gallery } from '../Gallery';
import { Modal } from '../Modal';
import { MessageInput, EditMessageForm } from '../MessageInput';
import { MessageActionsBox } from '../MessageActions';
import { Tooltip } from '../Tooltip';
import { LoadingIndicator } from '../Loading';
import { ReactionsList, ReactionSelector } from '../Reactions';
import DefaultMessageDeleted from './MessageDeleted';
import { useUserRole } from './hooks/useUserRole';
import { useReactionHandler } from './hooks/useReactionHandler';
import { useOpenThreadHandler } from './hooks/useOpenThreadHandler';
import { useMentionsHandler } from './hooks/useMentionsHandler';
import { useMuteHandler } from './hooks/useMuteHandler';
import { useFlagHandler } from './hooks/useFlagHandler';
import { isUserMuted, areMessagePropsEqual } from './utils';
import { useEditHandler } from './hooks/useEditHandler';
import { useDeleteHandler } from './hooks/useDeleteHandler';
import { useActionHandler } from './hooks/useActionHandler';
import { useRetryHandler } from './hooks/useRetryHandler';
import { useUserHandler } from './hooks/useUserHandler';

/** @type {(message: import('stream-chat').MessageResponse | undefined) => boolean} */
const messageHasReactions = (message) => {
  if (!message) {
    return false;
  }
  return Boolean(message.latest_reactions && message.latest_reactions.length);
};

/** @type {(message: import('stream-chat').MessageResponse | undefined) => boolean} */
const messageHasAttachments = (message) => {
  return Boolean(message && message.attachments && message.attachments.length);
};

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
    message,
    messageListRect,
    threadList,
    updateMessage: propUpdateMessage,
    handleAction: propHandleAction,
    handleOpenThread: propHandleOpenThread,
    handleReaction: propHandleReaction,
    handleRetry: propHandleRetry,
    onUserClick: onUserClickCustomHandler,
    onUserHover: onUserHoverCustomHandler,
    tDateTimeParser: propTDateTimeParser,
  } = props;
  /**
   *@type {import('types').ChannelContextValue}
   */
  const { updateMessage: channelUpdateMessage } = useContext(ChannelContext);
  const updateMessage = propUpdateMessage || channelUpdateMessage;
  const { tDateTimeParser } = useContext(TranslationContext);
  const [showDetailedReactions, setShowDetailedReactions] = useState(false);
  const [actionsBoxOpen, setActionsBoxOpen] = useState(false);
  const { isMyMessage } = useUserRole(props.message);
  const handleOpenThread = useOpenThreadHandler(message);
  const handleReaction = useReactionHandler(message);
  const handleAction = useActionHandler(message);
  const handleRetry = useRetryHandler();
  const { onUserClick, onUserHover } = useUserHandler(
    {
      onUserClickHandler: onUserClickCustomHandler,
      onUserHoverHandler: onUserHoverCustomHandler,
    },
    message,
  );
  const {
    Attachment = DefaultAttachment,
    MessageDeleted = DefaultMessageDeleted,
  } = props;
  /** @type { React.RefObject<ReactionSelector> | null } */
  const reactionSelectorRef = React.createRef();

  /** @type {EventListener} */
  const closeDetailedReactions = useCallback(
    (event) => {
      if (
        event.target &&
        // @ts-ignore
        reactionSelectorRef?.current?.reactionSelector?.current?.contains(
          event.target,
        )
      ) {
        return;
      }
      setShowDetailedReactions(() => false);
    },
    [setShowDetailedReactions, reactionSelectorRef],
  );
  /** @type {() => void} Typescript syntax */
  const onReactionListClick = () => setShowDetailedReactions(true);
  useEffect(() => {
    if (showDetailedReactions) {
      document.addEventListener('click', closeDetailedReactions);
      document.addEventListener('touchend', closeDetailedReactions);
    } else {
      document.removeEventListener('click', closeDetailedReactions);
      document.removeEventListener('touchend', closeDetailedReactions);
    }
    return () => {
      document.removeEventListener('click', closeDetailedReactions);
      document.removeEventListener('touchend', closeDetailedReactions);
    };
  }, [showDetailedReactions, closeDetailedReactions]);

  /** @type {() => void} Typescript syntax */
  const hideOptions = () => setActionsBoxOpen(false);
  useEffect(() => {
    if (message?.deleted_at) {
      document.removeEventListener('click', closeDetailedReactions);
      document.removeEventListener('touchend', closeDetailedReactions);
      document.removeEventListener('click', hideOptions);
    }
  }, [message, closeDetailedReactions]);
  const dateTimeParser = propTDateTimeParser || tDateTimeParser;
  const when =
    dateTimeParser &&
    message &&
    dateTimeParser(message.created_at).calendar &&
    dateTimeParser(message.created_at).calendar();
  const hasReactions = messageHasReactions(message);
  const hasAttachment = messageHasAttachments(message);

  const messageClasses = isMyMessage
    ? 'str-chat__message str-chat__message--me str-chat__message-simple str-chat__message-simple--me'
    : 'str-chat__message str-chat__message-simple';

  const images =
    hasAttachment &&
    message?.attachments?.filter(
      /** @type {(item: import('stream-chat').Attachment) => boolean} Typescript syntax */
      (item) => item.type === 'image',
    );

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
            Input={EditMessageForm}
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
						${hasReactions ? 'str-chat__message--with-reactions' : ''}
					`.trim()}
          onMouseLeave={hideOptions}
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
                  <MessageSimpleOptions
                    {...props}
                    hideOptions={hideOptions}
                    actionsBoxOpen={actionsBoxOpen}
                    setActionsBoxOpen={setActionsBoxOpen}
                    onReactionListClick={onReactionListClick}
                  />
                }
                {/* if reactions show them */}
                {hasReactions && !showDetailedReactions && (
                  <ReactionsList
                    reactions={message.latest_reactions}
                    reaction_counts={message.reaction_counts}
                    onClick={onReactionListClick}
                    reverse={true}
                  />
                )}
                {showDetailedReactions && (
                  <ReactionSelector
                    handleReaction={propHandleReaction || handleReaction}
                    detailedView
                    reaction_counts={message.reaction_counts}
                    latest_reactions={message.latest_reactions}
                    messageList={messageListRect}
                    ref={reactionSelectorRef}
                  />
                )}
              </React.Fragment>
            )}

            <div className="str-chat__message-attachment-container">
              {hasAttachment &&
                message.attachments?.map(
                  /** @type {(item: import('stream-chat').Attachment) => React.ReactElement | null} Typescript syntax */
                  (attachment, index) => {
                    if (
                      attachment.type === 'image' &&
                      images &&
                      images.length > 1
                    )
                      return null;
                    return (
                      <Attachment
                        key={`${message.id}-${index}`}
                        attachment={attachment}
                        actionHandler={propHandleAction || handleAction}
                      />
                    );
                  },
                )}
            </div>
            {images && images.length > 1 && <Gallery images={images} />}
            {message.text && (
              <MessageSimpleText
                {...props}
                actionsBoxOpen={actionsBoxOpen}
                hideOptions={hideOptions}
                setActionsBoxOpen={setActionsBoxOpen}
                showDetailedReactions={showDetailedReactions}
                onReactionListClick={onReactionListClick}
                // FIXME: There's some unmatched definition between the infered and the declared
                // ReactionSelector reference
                // @ts-ignore
                reactionSelectorRef={reactionSelectorRef}
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
              <span className="str-chat__message-simple-timestamp">{when}</span>
            </div>
          </div>
        </div>
      )}
    </React.Fragment>
  );
};

/**
 * @type { React.FC<import('types').MessageSimpleTextProps> }
 */
const MessageSimpleText = (props) => {
  const {
    onMentionsClickMessage: propOnMentionsClick,
    onMentionsHoverMessage: propOnMentionsHover,
    actionsBoxOpen,
    actionsEnabled,
    hideOptions,
    message,
    messageListRect,
    onReactionListClick,
    reactionSelectorRef,
    setActionsBoxOpen,
    showDetailedReactions,
    unsafeHTML,
  } = props;
  const { onMentionsClick, onMentionsHover } = useMentionsHandler(message);
  const { t } = useContext(TranslationContext);
  const { isMyMessage } = useUserRole(message);
  const hasReactions = messageHasReactions(message);
  const hasAttachment = messageHasAttachments(message);
  const handleReaction = useReactionHandler(message);

  if (!message || !message.text) {
    return null;
  }

  return (
    <div className="str-chat__message-text">
      <div
        data-testid="message-simple-inner-wrapper"
        className={`
          str-chat__message-text-inner str-chat__message-simple-text-inner
          ${hasAttachment ? 'str-chat__message-text-inner--has-attachment' : ''}
          ${
            isOnlyEmojis(message.text)
              ? 'str-chat__message-simple-text-inner--is-emoji'
              : ''
          }
        `.trim()}
        onMouseOver={propOnMentionsHover || onMentionsHover}
        onClick={propOnMentionsClick || onMentionsClick}
      >
        {message.type === 'error' && (
          <div className="str-chat__simple-message--error-message">
            {t && t('Error · Unsent')}
          </div>
        )}
        {message.status === 'failed' && (
          <div className="str-chat__simple-message--error-message">
            {t && t('Message Failed · Click to try again')}
          </div>
        )}

        {unsafeHTML ? (
          <div dangerouslySetInnerHTML={{ __html: message.html }} />
        ) : (
          renderText(message)
        )}

        {/* if reactions show them */}
        {hasReactions && !showDetailedReactions && (
          <ReactionsList
            reactions={message.latest_reactions}
            reaction_counts={message.reaction_counts}
            onClick={onReactionListClick}
            reverse={true}
          />
        )}
        {showDetailedReactions && (
          <ReactionSelector
            mine={isMyMessage}
            handleReaction={handleReaction}
            actionsEnabled={actionsEnabled}
            detailedView
            reaction_counts={message.reaction_counts}
            latest_reactions={message.latest_reactions}
            messageList={messageListRect}
            // @ts-ignore
            ref={reactionSelectorRef}
          />
        )}
      </div>
      {
        <MessageSimpleOptions
          {...props}
          hideOptions={hideOptions}
          actionsBoxOpen={actionsBoxOpen}
          setActionsBoxOpen={setActionsBoxOpen}
        />
      }
    </div>
  );
};

/**
 * @type { React.FC<import('types').MessageSimpleOptionsProps> }
 */
const MessageSimpleOptions = (props) => {
  const {
    message,
    initialMessage,
    threadList,
    actionsBoxOpen,
    hideOptions,
    setActionsBoxOpen,
    onReactionListClick,
    handleOpenThread: propHandleOpenThread,
  } = props;
  const { isMyMessage } = useUserRole(message);
  const handleOpenThread = useOpenThreadHandler(message);
  /**
   * @type {import('types').ChannelContextValue}
   */
  const { channel } = useContext(ChannelContext);
  const channelConfig = channel?.getConfig();
  if (
    !message ||
    message.type === 'error' ||
    message.type === 'system' ||
    message.type === 'ephemeral' ||
    message.status === 'failed' ||
    message.status === 'sending' ||
    initialMessage
  ) {
    return null;
  }
  if (isMyMessage) {
    return (
      <div className="str-chat__message-simple__actions">
        {
          <MessageSimpleActions
            {...props}
            actionsBoxOpen={actionsBoxOpen}
            hideOptions={hideOptions}
            setActionsBoxOpen={setActionsBoxOpen}
          />
        }
        {!threadList && channelConfig && channelConfig.replies && (
          <div
            data-testid="thread-action"
            onClick={propHandleOpenThread || handleOpenThread}
            className="str-chat__message-simple__actions__action str-chat__message-simple__actions__action--thread"
          >
            <svg width="14" height="10" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M8.516 3c4.78 0 4.972 6.5 4.972 6.5-1.6-2.906-2.847-3.184-4.972-3.184v2.872L3.772 4.994 8.516.5V3zM.484 5l4.5-4.237v1.78L2.416 5l2.568 2.125v1.828L.484 5z"
                fillRule="evenodd"
              />
            </svg>
          </div>
        )}
        {channelConfig && channelConfig.reactions && (
          <div
            data-testid="simple-message-reaction-action"
            className="str-chat__message-simple__actions__action str-chat__message-simple__actions__action--reactions"
            onClick={onReactionListClick}
          >
            <svg
              width="16"
              height="14"
              viewBox="0 0 16 14"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M11.108 8.05a.496.496 0 0 1 .212.667C10.581 10.147 8.886 11 7 11c-1.933 0-3.673-.882-4.33-2.302a.497.497 0 0 1 .9-.417C4.068 9.357 5.446 10 7 10c1.519 0 2.869-.633 3.44-1.738a.495.495 0 0 1 .668-.212zm.792-1.826a.477.477 0 0 1-.119.692.541.541 0 0 1-.31.084.534.534 0 0 1-.428-.194c-.106-.138-.238-.306-.539-.306-.298 0-.431.168-.54.307A.534.534 0 0 1 9.538 7a.544.544 0 0 1-.31-.084.463.463 0 0 1-.117-.694c.33-.423.742-.722 1.394-.722.653 0 1.068.3 1.396.724zm-7 0a.477.477 0 0 1-.119.692.541.541 0 0 1-.31.084.534.534 0 0 1-.428-.194c-.106-.138-.238-.306-.539-.306-.299 0-.432.168-.54.307A.533.533 0 0 1 2.538 7a.544.544 0 0 1-.31-.084.463.463 0 0 1-.117-.694c.33-.423.742-.722 1.394-.722.653 0 1.068.3 1.396.724zM7 0a7 7 0 1 1 0 14A7 7 0 0 1 7 0zm4.243 11.243A5.96 5.96 0 0 0 13 7a5.96 5.96 0 0 0-1.757-4.243A5.96 5.96 0 0 0 7 1a5.96 5.96 0 0 0-4.243 1.757A5.96 5.96 0 0 0 1 7a5.96 5.96 0 0 0 1.757 4.243A5.96 5.96 0 0 0 7 13a5.96 5.96 0 0 0 4.243-1.757z"
                fillRule="evenodd"
              />
            </svg>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="str-chat__message-simple__actions">
      {channelConfig && channelConfig.reactions && (
        <div
          className="str-chat__message-simple__actions__action str-chat__message-simple__actions__action--reactions"
          onClick={onReactionListClick}
        >
          <svg width="14" height="14" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M11.108 8.05a.496.496 0 0 1 .212.667C10.581 10.147 8.886 11 7 11c-1.933 0-3.673-.882-4.33-2.302a.497.497 0 0 1 .9-.417C4.068 9.357 5.446 10 7 10c1.519 0 2.869-.633 3.44-1.738a.495.495 0 0 1 .668-.212zm.792-1.826a.477.477 0 0 1-.119.692.541.541 0 0 1-.31.084.534.534 0 0 1-.428-.194c-.106-.138-.238-.306-.539-.306-.298 0-.431.168-.54.307A.534.534 0 0 1 9.538 7a.544.544 0 0 1-.31-.084.463.463 0 0 1-.117-.694c.33-.423.742-.722 1.394-.722.653 0 1.068.3 1.396.724zm-7 0a.477.477 0 0 1-.119.692.541.541 0 0 1-.31.084.534.534 0 0 1-.428-.194c-.106-.138-.238-.306-.539-.306-.299 0-.432.168-.54.307A.533.533 0 0 1 2.538 7a.544.544 0 0 1-.31-.084.463.463 0 0 1-.117-.694c.33-.423.742-.722 1.394-.722.653 0 1.068.3 1.396.724zM7 0a7 7 0 1 1 0 14A7 7 0 0 1 7 0zm4.243 11.243A5.96 5.96 0 0 0 13 7a5.96 5.96 0 0 0-1.757-4.243A5.96 5.96 0 0 0 7 1a5.96 5.96 0 0 0-4.243 1.757A5.96 5.96 0 0 0 1 7a5.96 5.96 0 0 0 1.757 4.243A5.96 5.96 0 0 0 7 13a5.96 5.96 0 0 0 4.243-1.757z"
              fillRule="evenodd"
            />
          </svg>
        </div>
      )}
      {!threadList && channelConfig && channelConfig.replies && (
        <div
          onClick={handleOpenThread}
          className="str-chat__message-simple__actions__action str-chat__message-simple__actions__action--thread"
        >
          <svg width="14" height="10" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M8.516 3c4.78 0 4.972 6.5 4.972 6.5-1.6-2.906-2.847-3.184-4.972-3.184v2.872L3.772 4.994 8.516.5V3zM.484 5l4.5-4.237v1.78L2.416 5l2.568 2.125v1.828L.484 5z"
              fillRule="evenodd"
            />
          </svg>
        </div>
      )}
      {
        <MessageSimpleActions
          {...props}
          actionsBoxOpen={actionsBoxOpen}
          hideOptions={hideOptions}
          setActionsBoxOpen={setActionsBoxOpen}
        />
      }
    </div>
  );
};

/**
 * @type { React.FC<import('types').MessageSimpleActionsProps> }
 */
const MessageSimpleActions = ({
  addNotification,
  message,
  mutes,
  getMessageActions,
  messageListRect,
  handleFlag: propHandleFlag,
  handleMute: propHandleMute,
  handleEdit: propHandleEdit,
  handleDelete: propHandleDelete,
  actionsBoxOpen,
  hideOptions,
  setEditingState,
  setActionsBoxOpen,
  getMuteUserSuccessNotification,
  getMuteUserErrorNotification,
  getFlagMessageErrorNotification,
  getFlagMessageSuccessNotification,
}) => {
  const { isMyMessage } = useUserRole(message);
  const handleDelete = useDeleteHandler(message);
  const handleEdit = useEditHandler(message, setEditingState);
  const handleFlag = useFlagHandler(message, {
    notify: addNotification,
    getSuccessNotification: getMuteUserSuccessNotification,
    getErrorNotification: getMuteUserErrorNotification,
  });
  const handleMute = useMuteHandler(message, {
    notify: addNotification,
    getErrorNotification: getFlagMessageErrorNotification,
    getSuccessNotification: getFlagMessageSuccessNotification,
  });
  const messageActions = getMessageActions();
  const isMuted = useCallback(() => {
    return isUserMuted(message, mutes);
  }, [message, mutes]);
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
  /** @type {() => void} Typescript syntax */
  const onClickOptionsAction = () => setActionsBoxOpen(true);

  if (messageActions.length === 0) {
    return null;
  }

  return (
    <div
      data-testid="message-actions"
      onClick={onClickOptionsAction}
      className="str-chat__message-simple__actions__action str-chat__message-simple__actions__action--options"
    >
      <MessageActionsBox
        getMessageActions={getMessageActions}
        open={actionsBoxOpen}
        messageListRect={messageListRect}
        handleFlag={propHandleFlag || handleFlag}
        isUserMuted={isMuted}
        handleMute={propHandleMute || handleMute}
        handleEdit={propHandleEdit || handleEdit}
        handleDelete={propHandleDelete || handleDelete}
        mine={isMyMessage}
      />
      <svg
        width="11"
        height="4"
        viewBox="0 0 11 4"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M1.5 3a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"
          fillRule="nonzero"
        />
      </svg>
    </div>
  );
};

/** @type { React.FC<import('types').MessageSimpleProps> } */
const MessageSimpleStatus = ({
  readBy,
  message,
  threadList,
  lastReceivedId,
}) => {
  const { t } = useContext(TranslationContext);
  /**
   * @type {import('types').ChannelContextValue}
   */
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
    readBy[0].id === client.user.id;
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
      (item) => !!item && !!client && item.id !== client.user.id,
    )[0];
    return (
      <span
        className="str-chat__message-simple-status"
        data-testid="message-status-read-by"
      >
        <Tooltip>{readBy && getReadByTooltipText(readBy, t, client)}</Tooltip>
        <Avatar
          name={lastReadUser && lastReadUser.name ? lastReadUser.name : null}
          image={lastReadUser && lastReadUser.image ? lastReadUser.image : null}
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
        <svg width="16" height="16" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zm3.72 6.633a.955.955 0 1 0-1.352-1.352L6.986 8.663 5.633 7.31A.956.956 0 1 0 4.28 8.663l2.029 2.028a.956.956 0 0 0 1.353 0l4.058-4.058z"
            fill="#006CFF"
            fillRule="evenodd"
          />
        </svg>
      </span>
    );
  }
  return null;
};

MessageSimple.propTypes = {
  /** The [message object](https://getstream.io/chat/docs/#message_format) */
  // @ts-ignore
  message: PropTypes.object,
  /**
   * The attachment UI component.
   * Default: [Attachment](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment.js)
   * */
  // @ts-ignore
  Attachment: PropTypes.elementType,
  /**
   * @deprecated Its not recommended to use this anymore. All the methods in this HOC are provided explicitly.
   *
   * The higher order message component, most logic is delegated to this component
   * @see See [Message HOC](https://getstream.github.io/stream-chat-react/#message) for example
   *
   * */
  // @ts-ignore
  Message: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.func,
    PropTypes.object,
  ]),
  /** render HTML instead of markdown. Posting HTML is only allowed server-side */
  unsafeHTML: PropTypes.bool,
  /** Client object */
  // @ts-ignore
  client: PropTypes.object,
  /** If its parent message in thread. */
  initialMessage: PropTypes.bool,
  /** Channel config object */
  // @ts-ignore
  channelConfig: PropTypes.object,
  /** If component is in thread list */
  threadList: PropTypes.bool,
  /**
   * Function to open thread on current messxage
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
   * Returns all allowed actions on message by current user e.g., [edit, delete, flag, mute]
   * Please check [Message](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Message.js) component for default implementation.
   * */
  // @ts-ignore
  getMessageActions: PropTypes.func,
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
   * Handler for actions. Actions in combination with attachments can be used to build [commands](https://getstream.io/chat/docs/#channel_commands).
   *
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
  // @ts-ignore
  MessageDeleted: PropTypes.elementType,
};

export default React.memo(MessageSimple, areMessagePropsEqual);
