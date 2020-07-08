// @ts-check
import React, { Fragment, useContext, useRef } from 'react';
import PropTypes from 'prop-types';

import MessageRepliesCountButton from './MessageRepliesCountButton';
import {
  isOnlyEmojis,
  renderText,
  getReadByTooltipText,
  smartRender,
} from '../../utils';
import { ChannelContext, TranslationContext } from '../../context';
import { Attachment as DefaultAttachment } from '../Attachment';
import { Avatar } from '../Avatar';
import { Gallery } from '../Gallery';
import { MessageInput, EditMessageForm } from '../MessageInput';
import { MessageActions } from '../MessageActions';
import { Tooltip } from '../Tooltip';
import { LoadingIndicator } from '../Loading';
import { SimpleReactionsList, ReactionSelector } from '../Reactions';
import {
  useUserRole,
  useActionHandler,
  useUserHandler,
  useReactionClick,
  useRetryHandler,
  useReactionHandler,
  useOpenThreadHandler,
  useMentionsUIHandler,
} from './hooks';
import {
  getNonImageAttachments,
  areMessagePropsEqual,
  getImages,
} from './utils';

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
 * MessageTeam - Render component, should be used together with the Message component
 * Implements the look and feel for a team style collaboration environment
 *
 * @example ../../docs/MessageTeam.md
 * @typedef { import('../../../types').MessageTeamProps } Props
 * @type {React.FC<Props>}
 */
// eslint-disable-next-line sonarjs/cognitive-complexity
const MessageTeam = (props) => {
  const {
    message,
    editing,
    clearEditingState,
    threadList,
    initialMessage,
    unsafeHTML,
    getMessageActions,
    MessageDeleted,
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
    tDateTimeParser: propTDateTimeParser,
  } = props;
  /**
   *@type {import('types').ChannelContextValue}
   */
  const { channel, updateMessage: channelUpdateMessage } = useContext(
    ChannelContext,
  );
  const channelConfig = propChannelConfig || channel?.getConfig();
  const { t: contextT, tDateTimeParser: contextTDateTimeParser } = useContext(
    TranslationContext,
  );
  const t = propT || contextT;
  const tDateTimeParser = propTDateTimeParser || contextTDateTimeParser;
  const groupStyles = props.groupStyles || ['single'];
  const reactionSelectorRef = useRef(null);
  const messageWrapperRef = useRef(null);
  const handleOpenThread = useOpenThreadHandler(message);
  const handleReaction = useReactionHandler(message);
  const retryHandler = useRetryHandler();
  const retry = propHandleRetry || retryHandler;
  const { onMentionsClick, onMentionsHover } = useMentionsUIHandler(message, {
    onMentionsClick: propOnMentionsClick,
    onMentionsHover: propOnMentionsHover,
  });
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
  const galleryImages = getImages(message);
  const attachments = getNonImageAttachments(message);
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
          clearEditingState={clearEditingState}
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

          <time dateTime={message?.created_at} title={message?.created_at}>
            {message &&
              tDateTimeParser &&
              Boolean(Date.parse(message.created_at)) &&
              tDateTimeParser(message.created_at).format('h:mmA')}
          </time>
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
                      reaction_counts={message.reaction_counts}
                      detailedView={true}
                      ref={reactionSelectorRef}
                    />
                  )}

                  {channelConfig && channelConfig.reactions && (
                    <span
                      data-testid="message-team-reaction-icon"
                      title="Reactions"
                      dangerouslySetInnerHTML={{
                        __html: reactionSvg,
                      }}
                      onClick={onReactionListClick}
                    />
                  )}
                  {!threadList && channelConfig && channelConfig.replies && (
                    <span
                      data-testid="message-team-thread-icon"
                      title="Start a thread"
                      dangerouslySetInnerHTML={{
                        __html: threadSvg,
                      }}
                      onClick={propHandleOpenThread || handleOpenThread}
                    />
                  )}
                  {message && getMessageActions().length > 0 && (
                    <MessageActions
                      addNotification={props.addNotification}
                      message={message}
                      mutes={props.mutes}
                      getMessageActions={props.getMessageActions}
                      messageListRect={props.messageListRect}
                      messageWrapperRef={messageWrapperRef}
                      setEditingState={props.setEditingState}
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
                {unsafeHTML ? (
                  <div dangerouslySetInnerHTML={{ __html: message.html }} />
                ) : (
                  renderText(message)
                )}
              </span>
            )}

            {galleryImages.length !== 0 && <Gallery images={galleryImages} />}

            {message && message.text === '' && (
              <MessageTeamAttachments
                Attachment={props.Attachment}
                message={message}
                handleAction={propHandleAction}
              />
            )}

            {message?.latest_reactions &&
              message.latest_reactions.length !== 0 &&
              message.text !== '' && (
                <SimpleReactionsList
                  reaction_counts={message.reaction_counts}
                  handleReaction={propHandleReaction || handleReaction}
                  reactions={message.latest_reactions}
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
          {message && message.text !== '' && attachments && (
            <MessageTeamAttachments
              Attachment={props.Attachment}
              message={message}
              handleAction={propHandleAction}
            />
          )}
          {message?.latest_reactions &&
            message.latest_reactions.length !== 0 &&
            message.text === '' && (
              <SimpleReactionsList
                reaction_counts={message.reaction_counts}
                handleReaction={propHandleReaction || handleReaction}
                reactions={message.latest_reactions}
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
          name={lastReadUser && lastReadUser.name ? lastReadUser.name : null}
          image={lastReadUser && lastReadUser.image ? lastReadUser.image : null}
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

/** @type {(props: import('types').MessageTeamAttachmentsProps) => React.ReactElement | null} Typescript syntax */
const MessageTeamAttachments = (props) => {
  const {
    Attachment = DefaultAttachment,
    message,
    handleAction: propHandleAction,
  } = props;
  const handleAction = useActionHandler(message);
  const attachments = getNonImageAttachments(message);
  if (attachments.length > 0 && Attachment) {
    return (
      <Fragment>
        {attachments.map(
          /** @type {(item: import('stream-chat').Attachment) => React.ReactElement | null} Typescript syntax */
          (attachment, index) => (
            <Attachment
              key={`${message?.id}-${index}`}
              attachment={attachment}
              actionHandler={propHandleAction || handleAction}
            />
          ),
        )}
      </Fragment>
    );
  }
  return null;
};

MessageTeam.propTypes = {
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
   * */
  // @ts-ignore
  Message: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.func,
    PropTypes.object,
  ]).isRequired,
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
  /** Position of message in group. Possible values: top, bottom, middle, single */
  groupStyles: PropTypes.array,
  /**
   * The component that will be rendered if the message has been deleted.
   * All of Message's props are passed into this component.
   */
  // @ts-ignore
  MessageDeleted: PropTypes.elementType,
};

export default React.memo(MessageTeam, areMessagePropsEqual);
