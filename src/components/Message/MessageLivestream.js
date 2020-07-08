// @ts-check
import React, {
  useCallback,
  useEffect,
  useContext,
  useRef,
  useState,
} from 'react';
import PropTypes from 'prop-types';

import MessageRepliesCountButton from './MessageRepliesCountButton';

import { isOnlyEmojis, renderText, smartRender } from '../../utils';
import { ChannelContext, TranslationContext } from '../../context';

import { Avatar } from '../Avatar';
import { Attachment as DefaultAttachment } from '../Attachment';
import { Gallery } from '../Gallery';
import { MessageInput, EditMessageForm } from '../MessageInput';
import { SimpleReactionsList, ReactionSelector } from '../Reactions';
import {
  useReactionHandler,
  useUserHandler,
  useRetryHandler,
  useOpenThreadHandler,
  useActionHandler,
  useReactionClick,
  useMentionsUIHandler,
} from './hooks';
import {
  messageHasAttachments,
  getImages,
  getNonImageAttachments,
  areMessagePropsEqual,
} from './utils';
import { MessageActions } from '../MessageActions';

const reactionSvg =
  '<svg width="14" height="14" xmlns="http://www.w3.org/2000/svg"><path d="M11.108 8.05a.496.496 0 0 1 .212.667C10.581 10.147 8.886 11 7 11c-1.933 0-3.673-.882-4.33-2.302a.497.497 0 0 1 .9-.417C4.068 9.357 5.446 10 7 10c1.519 0 2.869-.633 3.44-1.738a.495.495 0 0 1 .668-.212zm.792-1.826a.477.477 0 0 1-.119.692.541.541 0 0 1-.31.084.534.534 0 0 1-.428-.194c-.106-.138-.238-.306-.539-.306-.298 0-.431.168-.54.307A.534.534 0 0 1 9.538 7a.544.544 0 0 1-.31-.084.463.463 0 0 1-.117-.694c.33-.423.742-.722 1.394-.722.653 0 1.068.3 1.396.724zm-7 0a.477.477 0 0 1-.119.692.541.541 0 0 1-.31.084.534.534 0 0 1-.428-.194c-.106-.138-.238-.306-.539-.306-.299 0-.432.168-.54.307A.533.533 0 0 1 2.538 7a.544.544 0 0 1-.31-.084.463.463 0 0 1-.117-.694c.33-.423.742-.722 1.394-.722.653 0 1.068.3 1.396.724zM7 0a7 7 0 1 1 0 14A7 7 0 0 1 7 0zm4.243 11.243A5.96 5.96 0 0 0 13 7a5.96 5.96 0 0 0-1.757-4.243A5.96 5.96 0 0 0 7 1a5.96 5.96 0 0 0-4.243 1.757A5.96 5.96 0 0 0 1 7a5.96 5.96 0 0 0 1.757 4.243A5.96 5.96 0 0 0 7 13a5.96 5.96 0 0 0 4.243-1.757z" fillRule="evenodd"/></svg>';
const threadSvg =
  '<svg width="14" height="10" xmlns="http://www.w3.org/2000/svg"><path d="M8.516 3c4.78 0 4.972 6.5 4.972 6.5-1.6-2.906-2.847-3.184-4.972-3.184v2.872L3.772 4.994 8.516.5V3zM.484 5l4.5-4.237v1.78L2.416 5l2.568 2.125v1.828L.484 5z" fillRule="evenodd" /></svg>';

const ErrorIcon = () => (
  <svg width="14" height="14" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M7 0a7 7 0 1 0 0 14A7 7 0 0 0 7 0zm.875 10.938a.438.438 0 0 1-.438.437h-.875a.438.438 0 0 1-.437-.438v-.874c0-.242.196-.438.438-.438h.875c.241 0 .437.196.437.438v.874zm0-2.626a.438.438 0 0 1-.438.438h-.875a.438.438 0 0 1-.437-.438v-5.25c0-.241.196-.437.438-.437h.875c.241 0 .437.196.437.438v5.25z"
      fill="#EA152F"
      fillRule="evenodd"
    />
  </svg>
);
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
    editing,
    clearEditingState,
    initialMessage,
    unsafeHTML,
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
  const { updateMessage: channelUpdateMessage } = useContext(ChannelContext);
  const { onMentionsClick, onMentionsHover } = useMentionsUIHandler(message, {
    onMentionsClick: propOnMentionsClick,
    onMentionsHover: propOnMentionsHover,
  });
  const handleAction = useActionHandler(message);
  const handleReaction = useReactionHandler(message);
  const handleOpenThread = useOpenThreadHandler(message);
  const handleRetry = useRetryHandler();
  const retryHandler = propHandleRetry || handleRetry;
  const { onReactionListClick, showDetailedReactions } = useReactionClick(
    reactionSelectorRef,
    message,
    messageWrapperRef,
  );
  const { onUserClick, onUserHover } = useUserHandler(
    {
      onUserClickHandler: propOnUserClick,
      onUserHoverHandler: propOnUserHover,
    },
    message,
  );

  const hasAttachment = messageHasAttachments(message);
  const galleryImages = getImages(message);
  const attachments = getNonImageAttachments(message);
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
          clearEditingState={clearEditingState}
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
        {showDetailedReactions && (
          <ReactionSelector
            reverse={false}
            handleReaction={handleReaction}
            detailedView
            latest_reactions={message?.latest_reactions}
            reaction_counts={message?.reaction_counts}
            ref={reactionSelectorRef}
          />
        )}
        <MessageLivestreamActions
          initialMessage={initialMessage}
          message={message}
          onReactionListClick={onReactionListClick}
          messageWrapperRef={messageWrapperRef}
          getMessageActions={props.getMessageActions}
          tDateTimeParser={propTDateTimeParser}
          channelConfig={props.channelConfig}
          threadList={props.threadList}
          handleOpenThread={props.handleOpenThread || handleOpenThread}
          setEditingState={props.setEditingState}
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
                renderText(message)}

              {message.type !== 'error' &&
                message.status !== 'failed' &&
                unsafeHTML && (
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

            {hasAttachment &&
              attachments.map(
                /** @type {(item: import('stream-chat').Attachment) => React.ReactElement | null} Typescript syntax */
                (attachment, index) => (
                  <Attachment
                    key={`${message?.id}-${index}`}
                    attachment={attachment}
                    actionHandler={propHandleAction || handleAction}
                  />
                ),
              )}

            {galleryImages.length !== 0 && <Gallery images={galleryImages} />}

            <SimpleReactionsList
              reaction_counts={message.reaction_counts}
              reactions={message.latest_reactions}
              handleReaction={propHandleReaction || handleReaction}
            />

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
    messageWrapperRef,
    onReactionListClick,
    getMessageActions,
    handleOpenThread,
    tDateTimeParser: propTDateTimeParser,
  } = props;
  const { tDateTimeParser } = useContext(TranslationContext);
  const dateParser = propTDateTimeParser || tDateTimeParser;
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
      <span className={`str-chat__message-livestream-time`}>
        {dateParser && dateParser(message.created_at).format('h:mmA')}
      </span>
      {channelConfig && channelConfig.reactions && (
        <span
          onClick={onReactionListClick}
          data-testid="message-livestream-reactions-action"
        >
          <span
            dangerouslySetInnerHTML={{
              __html: reactionSvg,
            }}
          />
        </span>
      )}
      {!threadList && channelConfig && channelConfig.replies && (
        <span
          data-testid="message-livestream-thread-action"
          dangerouslySetInnerHTML={{
            __html: threadSvg,
          }}
          onClick={handleOpenThread}
        />
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
  // @ts-ignore
  message: PropTypes.object,
  /**
   * The attachment UI component.
   * Default: [Attachment](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Attachment.js)
   * */
  // @ts-ignore
  Attachment: PropTypes.elementType,
  /**
   *
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
  ]).isRequired,
  /** render HTML instead of markdown. Posting HTML is only allowed server-side */
  unsafeHTML: PropTypes.bool,
  /** If its parent message in thread. */
  initialMessage: PropTypes.bool,
  /** Channel config object */
  // @ts-ignore
  channelConfig: PropTypes.object,
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
   */
  handleRetry: PropTypes.func,
  /**
   * Add or remove reaction on message
   *
   * @param type Type of reaction - 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry'
   * @param event Dom event which triggered this function
   */
  handleReaction: PropTypes.func,
  /** If actions such as edit, delete, flag, mute are enabled on message */
  /** @deprecated This property is no longer used * */
  actionsEnabled: PropTypes.bool,
  /** DOMRect object for parent MessageList component */
  // @ts-ignore
  messageListRect: PropTypes.object,
  /**
   * Handler for actions. Actions in combination with attachments can be used to build [commands](https://getstream.io/chat/docs/#channel_commands).
   *
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
  // @ts-ignore
  MessageDeleted: PropTypes.elementType,
};

export default React.memo(MessageLivestreamComponent, areMessagePropsEqual);
