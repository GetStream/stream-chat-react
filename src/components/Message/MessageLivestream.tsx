import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { MessageDeleted as DefaultMessageDeleted } from './MessageDeleted';
import { MessageRepliesCountButton } from './MessageRepliesCountButton';
import { MessageTimestamp } from './MessageTimestamp';
import {
  useActionHandler,
  useEditHandler,
  useMentionsUIHandler,
  useOpenThreadHandler,
  useReactionClick,
  useReactionHandler,
  useRetryHandler,
  useUserHandler,
} from './hooks';
import {
  PinIndicator as DefaultPinIndicator,
  ErrorIcon,
  ReactionIcon,
  ThreadIcon,
} from './icons';

import { Attachment as DefaultAttachment } from '../Attachment';
import { Avatar as DefaultAvatar } from '../Avatar';
import { MessageActions } from '../MessageActions';
import {
  EditMessageForm as DefaultEditMessageForm,
  MessageInput,
} from '../MessageInput';
import {
  ReactionSelector as DefaultReactionSelector,
  SimpleReactionsList as DefaultReactionsList,
} from '../Reactions';

import { useChannelContext, useTranslationContext } from '../../context';
import { isOnlyEmojis, renderText } from '../../utils';

import type { TranslationLanguages } from 'stream-chat';

import type { MessageUIComponentProps, MouseEventHandler } from './types';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
  UnknownType,
} from '../../../types/types';

/**
 * MessageLivestream - Render component, should be used together with the Message component
 * Implements the look and feel for a livestream use case.
 *
 * @example ./MessageLivestream.md
 */
const UnMemoizedMessageLivestream = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  props: MessageUIComponentProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    addNotification,
    Attachment = DefaultAttachment,
    Avatar = DefaultAvatar,
    channelConfig: propChannelConfig,
    clearEditingState: propClearEdit,
    EditMessageInput = DefaultEditMessageForm,
    editing: propEditing,
    formatDate,
    getMessageActions,
    groupStyles,
    handleAction: propHandleAction,
    handleOpenThread: propHandleOpenThread,
    handleReaction: propHandleReaction,
    handleRetry: propHandleRetry,
    initialMessage,
    message,
    MessageDeleted = DefaultMessageDeleted,
    onMentionsClickMessage: propOnMentionsClick,
    onMentionsHoverMessage: propOnMentionsHover,
    onUserClick: propOnUserClick,
    onUserHover: propOnUserHover,
    PinIndicator = DefaultPinIndicator,
    ReactionsList = DefaultReactionsList,
    ReactionSelector = DefaultReactionSelector,
    threadList,
    setEditingState: propSetEdit,
    unsafeHTML,
    updateMessage: propUpdateMessage,
  } = props;

  const { channel, updateMessage: channelUpdateMessage } = useChannelContext<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >();
  const { t, userLanguage } = useTranslationContext();

  const messageWrapperRef = useRef<HTMLDivElement | null>(null);
  const reactionSelectorRef = useRef<HTMLDivElement | null>(null);

  const channelConfig = propChannelConfig || channel?.getConfig();

  const handleAction = useActionHandler(message);
  const handleOpenThread = useOpenThreadHandler(message);
  const handleReaction = useReactionHandler(message);
  const handleRetry = useRetryHandler<At, Ch, Co, Ev, Me, Re, Us>();

  const {
    clearEdit: ownClearEditing,
    editing: ownEditing,
    setEdit: ownSetEditing,
  } = useEditHandler();

  const { onMentionsClick, onMentionsHover } = useMentionsUIHandler(message, {
    onMentionsClick: propOnMentionsClick,
    onMentionsHover: propOnMentionsHover,
  });

  const {
    isReactionEnabled,
    onReactionListClick,
    showDetailedReactions,
  } = useReactionClick(message, reactionSelectorRef, messageWrapperRef);

  const { onUserClick, onUserHover } = useUserHandler(message, {
    onUserClickHandler: propOnUserClick,
    onUserHoverHandler: propOnUserHover,
  });

  const clearEdit = propClearEdit || ownClearEditing;
  const editing = propEditing || ownEditing;
  const retryHandler = propHandleRetry || handleRetry;
  const setEdit = propSetEdit || ownSetEditing;

  const messageTextToRender =
    message?.i18n?.[`${userLanguage}_text` as `${TranslationLanguages}_text`] ||
    message?.text;

  const messageText = useMemo(
    () => renderText(messageTextToRender, message?.mentioned_users),
    [message?.mentioned_users, messageTextToRender],
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
    return <MessageDeleted message={message} />;
  }

  if (editing) {
    return (
      <div
        className={`str-chat__message-team str-chat__message-team--${firstGroupStyle} str-chat__message-team--editing`}
        data-testid={'message-livestream-edit'}
      >
        {(firstGroupStyle === 'top' || firstGroupStyle === 'single') && (
          <div className='str-chat__message-team-meta'>
            <Avatar
              image={message.user?.image}
              name={message.user?.name || message.user?.id}
              onClick={onUserClick}
              onMouseOver={onUserHover}
              size={40}
            />
          </div>
        )}
        <MessageInput
          clearEditingState={clearEdit}
          Input={EditMessageInput}
          message={message}
          updateMessage={propUpdateMessage || channelUpdateMessage}
        />
      </div>
    );
  }

  return (
    <>
      {message?.pinned && (
        <div className='str-chat__message-livestream-pin-indicator'>
          <PinIndicator message={message} t={t} />
        </div>
      )}
      <div
        className={`str-chat__message-livestream str-chat__message-livestream--${firstGroupStyle} str-chat__message-livestream--${
          message.type
        } str-chat__message-livestream--${message.status} ${
          initialMessage ? 'str-chat__message-livestream--initial-message' : ''
        } ${message?.pinned ? 'pinned-message' : ''}`}
        data-testid='message-livestream'
        ref={messageWrapperRef}
      >
        {showDetailedReactions && isReactionEnabled && (
          <ReactionSelector
            detailedView
            handleReaction={handleReaction}
            latest_reactions={message?.latest_reactions}
            own_reactions={message.own_reactions}
            reaction_counts={message?.reaction_counts || undefined}
            ref={reactionSelectorRef}
            reverse={false}
          />
        )}
        <MessageLivestreamActions
          addNotification={addNotification}
          channelConfig={channelConfig}
          formatDate={formatDate}
          getMessageActions={getMessageActions}
          handleOpenThread={propHandleOpenThread || handleOpenThread}
          initialMessage={initialMessage}
          message={message}
          messageWrapperRef={messageWrapperRef}
          onReactionListClick={onReactionListClick}
          setEditingState={setEdit}
          threadList={threadList}
        />
        <div className='str-chat__message-livestream-left'>
          <Avatar
            image={message.user?.image}
            name={message.user?.name || message?.user?.id}
            onClick={onUserClick}
            onMouseOver={onUserHover}
            size={30}
          />
        </div>
        <div className='str-chat__message-livestream-right'>
          <div className='str-chat__message-livestream-content'>
            <div className='str-chat__message-livestream-author'>
              <strong>{message.user?.name || message.user?.id}</strong>
              {message?.type === 'error' && (
                <div className='str-chat__message-team-error-header'>
                  {t('Only visible to you')}
                </div>
              )}
            </div>
            <div
              className={
                isOnlyEmojis(message.text)
                  ? 'str-chat__message-livestream-text--is-emoji'
                  : ''
              }
              data-testid='message-livestream-text'
              onClick={onMentionsClick}
              onMouseOver={onMentionsHover}
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
                <p data-testid='message-livestream-error'>
                  <ErrorIcon />
                  {message.text}
                </p>
              )}
              {message.type === 'error' && message.command && (
                <p data-testid='message-livestream-command-error'>
                  <ErrorIcon />
                  {/* TODO: Translate following sentence */}
                  <strong>/{message.command}</strong> is not a valid command
                </p>
              )}
              {message.status === 'failed' && (
                <p onClick={() => retryHandler(message)}>
                  <ErrorIcon />
                  {t('Message failed. Click to try again.')}
                </p>
              )}
            </div>
            {message?.attachments && Attachment && (
              <Attachment
                actionHandler={propHandleAction || handleAction}
                attachments={message.attachments}
              />
            )}
            {isReactionEnabled && (
              <ReactionsList
                handleReaction={propHandleReaction || handleReaction}
                own_reactions={message.own_reactions}
                reaction_counts={message.reaction_counts || undefined}
                reactions={message.latest_reactions}
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
    </>
  );
};

type PropsDrilledToMessageLivestreamActions =
  | 'addNotification'
  | 'channelConfig'
  | 'formatDate'
  | 'getMessageActions'
  | 'handleOpenThread'
  | 'initialMessage'
  | 'message'
  | 'setEditingState'
  | 'threadList';

export type MessageLivestreamActionsProps<
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = Pick<
  MessageUIComponentProps<At, Ch, Co, Ev, Me, Re, Us>,
  PropsDrilledToMessageLivestreamActions
> & {
  messageWrapperRef: React.RefObject<HTMLDivElement>;
  onReactionListClick: MouseEventHandler;
};

const MessageLivestreamActions = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  props: MessageLivestreamActionsProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    channelConfig,
    formatDate,
    getMessageActions,
    handleOpenThread,
    initialMessage,
    message,
    messageWrapperRef,
    onReactionListClick,
    threadList,
  } = props;

  const [actionsBoxOpen, setActionsBoxOpen] = useState(false);

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
      className={`str-chat__message-livestream-actions`}
      data-testid={'message-livestream-actions'}
    >
      <MessageTimestamp
        customClass='str-chat__message-livestream-time'
        formatDate={formatDate}
        message={message}
      />
      {channelConfig && channelConfig.reactions && (
        <span
          data-testid='message-livestream-reactions-action'
          onClick={onReactionListClick}
        >
          <span>
            <ReactionIcon />
          </span>
        </span>
      )}
      {!threadList && channelConfig && channelConfig.replies && (
        <span
          data-testid='message-livestream-thread-action'
          onClick={handleOpenThread}
        >
          <ThreadIcon />
        </span>
      )}
      <MessageActions
        {...props}
        customWrapperClass={''}
        getMessageActions={getMessageActions}
        inline
      />
    </div>
  );
};

export const MessageLivestream = React.memo(
  UnMemoizedMessageLivestream,
) as typeof UnMemoizedMessageLivestream;
