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
  useMentionsUIHandler,
  useReactionClick,
  useUserHandler,
} from './hooks';
import {
  PinIndicator as DefaultPinIndicator,
  ErrorIcon,
  ReactionIcon,
  ThreadIcon,
} from './icons';
import { areMessageUIPropsEqual } from './utils';

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
import { renderText as defaultRenderText, isOnlyEmojis } from '../../utils';

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
} from '../../../types/types';

type MessageLivestreamWithContextProps<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = MessageUIComponentProps<At, Ch, Co, Ev, Me, Re, Us> & {
  isReactionEnabled: boolean;
  messageWrapperRef: React.MutableRefObject<HTMLDivElement | null>;
  onReactionListClick: MouseEventHandler;
  reactionSelectorRef: React.MutableRefObject<HTMLDivElement | null>;
  showDetailedReactions: boolean;
};

const MessageLivestreamWithContext = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  props: MessageLivestreamWithContextProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    addNotification,
    Attachment = DefaultAttachment,
    Avatar = DefaultAvatar,
    channelConfig,
    clearEditingState,
    EditMessageInput = DefaultEditMessageForm,
    editing,
    formatDate,
    getMessageActions,
    groupStyles,
    handleAction,
    handleOpenThread,
    handleReaction,
    handleRetry,
    initialMessage,
    isReactionEnabled,
    message,
    MessageDeleted = DefaultMessageDeleted,
    messageWrapperRef,
    onMentionsClickMessage,
    onMentionsHoverMessage,
    onReactionListClick,
    onUserClick: propOnUserClick,
    onUserHover: propOnUserHover,
    PinIndicator = DefaultPinIndicator,
    ReactionsList = DefaultReactionsList,
    ReactionSelector = DefaultReactionSelector,
    reactionSelectorRef,
    renderText = defaultRenderText,
    threadList,
    setEditingState,
    showDetailedReactions,
    unsafeHTML,
    updateMessage,
  } = props;

  const { t, userLanguage } = useTranslationContext();

  const { onUserClick, onUserHover } = useUserHandler(message, {
    onUserClickHandler: propOnUserClick,
    onUserHoverHandler: propOnUserHover,
  });

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
          clearEditingState={clearEditingState}
          Input={EditMessageInput}
          message={message}
          updateMessage={updateMessage}
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
          handleOpenThread={handleOpenThread}
          initialMessage={initialMessage}
          message={message}
          messageWrapperRef={messageWrapperRef}
          onReactionListClick={onReactionListClick}
          setEditingState={setEditingState}
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
              onClick={onMentionsClickMessage}
              onMouseOver={onMentionsHoverMessage}
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
                <p onClick={() => handleRetry(message)}>
                  <ErrorIcon />
                  {t('Message failed. Click to try again.')}
                </p>
              )}
            </div>
            {message?.attachments && Attachment && (
              <Attachment
                actionHandler={handleAction}
                attachments={message.attachments}
              />
            )}
            {isReactionEnabled && (
              <ReactionsList
                handleReaction={handleReaction}
                own_reactions={message.own_reactions}
                reaction_counts={message.reaction_counts || undefined}
                reactions={message.latest_reactions}
              />
            )}
            {!initialMessage && (
              <MessageRepliesCountButton
                onClick={handleOpenThread}
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
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = Pick<
  MessageUIComponentProps<At, Ch, Co, Ev, Me, Re, Us>,
  PropsDrilledToMessageLivestreamActions
> & {
  messageWrapperRef: React.RefObject<HTMLDivElement>;
  onReactionListClick: MouseEventHandler;
};

const MessageLivestreamActions = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
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
      {channelConfig?.reactions && (
        <span
          data-testid='message-livestream-reactions-action'
          onClick={onReactionListClick}
        >
          <span>
            <ReactionIcon />
          </span>
        </span>
      )}
      {!threadList && channelConfig?.replies && (
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

const MemoizedMessageLivestream = React.memo(
  MessageLivestreamWithContext,
  areMessageUIPropsEqual,
) as typeof MessageLivestreamWithContext;

/**
 * MessageLivestream - handles the rendering of a message and depends on the Message component for all the logic.
 * Implements the look and feel for a livestream use case.
 * @example ./MessageLivestream.md
 */
export const MessageLivestream = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  props: MessageUIComponentProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    message,
    onMentionsClickMessage: propOnMentionsClick,
    onMentionsHoverMessage: propOnMentionsHover,
    updateMessage: propUpdateMessage,
  } = props;

  const { updateMessage: contextUpdateMessage } = useChannelContext<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >();

  const messageWrapperRef = useRef<HTMLDivElement | null>(null);
  const reactionSelectorRef = useRef<HTMLDivElement | null>(null);

  const { onMentionsClick, onMentionsHover } = useMentionsUIHandler(message, {
    onMentionsClick: propOnMentionsClick,
    onMentionsHover: propOnMentionsHover,
  });

  const {
    isReactionEnabled,
    onReactionListClick,
    showDetailedReactions,
  } = useReactionClick(message, reactionSelectorRef, messageWrapperRef);

  const updateMessage = propUpdateMessage || contextUpdateMessage;

  return (
    <MemoizedMessageLivestream
      {...props}
      isReactionEnabled={isReactionEnabled}
      messageWrapperRef={messageWrapperRef}
      onMentionsClickMessage={onMentionsClick}
      onMentionsHoverMessage={onMentionsHover}
      onReactionListClick={onReactionListClick}
      reactionSelectorRef={reactionSelectorRef}
      showDetailedReactions={showDetailedReactions}
      updateMessage={updateMessage}
    />
  );
};
