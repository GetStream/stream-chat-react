import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { MessageDeleted as DefaultMessageDeleted } from './MessageDeleted';
import { MessageRepliesCountButton as DefaultMessageRepliesCountButton } from './MessageRepliesCountButton';
import { MessageTimestamp as DefaultTimestamp } from './MessageTimestamp';
import { useReactionClick } from './hooks';
import { PinIndicator as DefaultPinIndicator, ErrorIcon, ReactionIcon, ThreadIcon } from './icons';
import { QuotedMessage as DefaultQuotedMessage } from './QuotedMessage';
import { areMessageUIPropsEqual, MESSAGE_ACTIONS, showMessageActionsBox } from './utils';

import { Avatar as DefaultAvatar } from '../Avatar';
import { MessageActions } from '../MessageActions';
import { EditMessageForm as DefaultEditMessageForm, MessageInput } from '../MessageInput';
import {
  ReactionSelector as DefaultReactionSelector,
  SimpleReactionsList as DefaultReactionsList,
} from '../Reactions';

import { useComponentContext } from '../../context/ComponentContext';
import { MessageContextValue, useMessageContext } from '../../context/MessageContext';
import { useTranslationContext } from '../../context/TranslationContext';
import { renderText as defaultRenderText, isOnlyEmojis } from '../../utils';

import type { TranslationLanguages } from 'stream-chat';

import type { MessageUIComponentProps, ReactEventHandler } from './types';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../types/types';

type MessageLivestreamWithContextProps<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = MessageContextValue<At, Ch, Co, Ev, Me, Re, Us> & {
  isReactionEnabled: boolean;
  messageWrapperRef: React.MutableRefObject<HTMLDivElement | null>;
  onReactionListClick: ReactEventHandler;
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
    clearEditingState,
    editing,
    groupStyles,
    handleAction,
    handleOpenThread,
    handleRetry,
    initialMessage,
    isReactionEnabled,
    message,
    messageWrapperRef,
    onMentionsClickMessage,
    onMentionsHoverMessage,
    onReactionListClick,
    onUserClick,
    onUserHover,
    reactionSelectorRef,
    renderText = defaultRenderText,
    showDetailedReactions,
    unsafeHTML,
  } = props;

  const {
    Attachment,
    Avatar = DefaultAvatar,
    EditMessageInput = DefaultEditMessageForm,
    MessageDeleted = DefaultMessageDeleted,
    MessageRepliesCountButton = DefaultMessageRepliesCountButton,
    PinIndicator = DefaultPinIndicator,
    QuotedMessage = DefaultQuotedMessage,
    ReactionsList = DefaultReactionsList,
    ReactionSelector = DefaultReactionSelector,
  } = useComponentContext<At, Ch, Co, Ev, Me, Re, Us>('MessageLivestream');
  const { t, userLanguage } = useTranslationContext('MessageLivestream');

  const messageTextToRender =
    message.i18n?.[`${userLanguage}_text` as `${TranslationLanguages}_text`] || message.text;

  const messageText = useMemo(() => renderText(messageTextToRender, message.mentioned_users), [
    message.mentioned_users,
    messageTextToRender,
  ]);

  const firstGroupStyle = groupStyles ? groupStyles[0] : 'single';

  if (message.customType === 'message.date') {
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
        />
      </div>
    );
  }

  return (
    <>
      {message.pinned && (
        <div className='str-chat__message-livestream-pin-indicator'>
          <PinIndicator message={message} t={t} />
        </div>
      )}
      <div
        className={`str-chat__message-livestream str-chat__message-livestream--${firstGroupStyle} str-chat__message-livestream--${
          message.type
        } str-chat__message-livestream--${message.status} ${
          initialMessage ? 'str-chat__message-livestream--initial-message' : ''
        } ${message.pinned ? 'pinned-message' : ''}`}
        data-testid='message-livestream'
        ref={messageWrapperRef}
      >
        {showDetailedReactions && isReactionEnabled && (
          <ReactionSelector ref={reactionSelectorRef} />
        )}
        <MessageLivestreamActions
          messageWrapperRef={messageWrapperRef}
          onReactionListClick={onReactionListClick}
        />
        <div className='str-chat__message-livestream-left'>
          <Avatar
            image={message.user?.image}
            name={message.user?.name || message.user?.id}
            onClick={onUserClick}
            onMouseOver={onUserHover}
            size={30}
          />
        </div>
        <div className='str-chat__message-livestream-right'>
          <div className='str-chat__message-livestream-content'>
            <div className='str-chat__message-livestream-author'>
              <strong>{message.user?.name || message.user?.id}</strong>
              {message.type === 'error' && (
                <div className='str-chat__message-team-error-header'>
                  {t('Only visible to you')}
                </div>
              )}
            </div>
            <div
              className={
                isOnlyEmojis(message.text) ? 'str-chat__message-livestream-text--is-emoji' : ''
              }
              data-testid='message-livestream-text'
              onClick={onMentionsClickMessage}
              onMouseOver={onMentionsHoverMessage}
            >
              {message.quoted_message && (
                <div className='livestream-quoted-message'>
                  <QuotedMessage />
                </div>
              )}
              {message.type !== 'error' &&
                message.status !== 'failed' &&
                !unsafeHTML &&
                messageText}
              {message.type !== 'error' &&
                message.status !== 'failed' &&
                unsafeHTML &&
                !!message.html && <div dangerouslySetInnerHTML={{ __html: message.html }} />}
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
                <p
                  onClick={message.errorStatusCode !== 403 ? () => handleRetry(message) : undefined}
                >
                  <ErrorIcon />
                  {message.errorStatusCode !== 403
                    ? t('Message Failed · Click to try again')
                    : t('Message Failed · Unauthorized')}
                </p>
              )}
            </div>
            {message.attachments?.length ? (
              <Attachment actionHandler={handleAction} attachments={message.attachments} />
            ) : null}
            {isReactionEnabled && <ReactionsList />}
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

export type MessageLivestreamActionsProps = {
  messageWrapperRef: React.RefObject<HTMLDivElement>;
  onReactionListClick: ReactEventHandler;
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
  props: MessageLivestreamActionsProps,
) => {
  const { messageWrapperRef, onReactionListClick } = props;

  const { MessageTimestamp = DefaultTimestamp } = useComponentContext<At, Ch, Co, Ev, Me, Re, Us>(
    'MessageLivestream',
  );

  const {
    getMessageActions,
    handleOpenThread,
    initialMessage,
    message,
    threadList,
  } = useMessageContext<At, Ch, Co, Ev, Me, Re, Us>('MessageLivestream');

  const [actionsBoxOpen, setActionsBoxOpen] = useState(false);

  const hideOptions = useCallback(() => setActionsBoxOpen(false), []);
  const messageDeletedAt = !!message.deleted_at;
  const messageWrapper = messageWrapperRef?.current;

  const messageActions = getMessageActions();
  const showActionsBox = showMessageActionsBox(messageActions);

  const shouldShowReactions = messageActions.indexOf(MESSAGE_ACTIONS.react) > -1;
  const shouldShowReplies = messageActions.indexOf(MESSAGE_ACTIONS.reply) > -1 && !threadList;

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
      <MessageTimestamp customClass='str-chat__message-livestream-time' />
      {shouldShowReactions && (
        <span data-testid='message-livestream-reactions-action' onClick={onReactionListClick}>
          <span>
            <ReactionIcon />
          </span>
        </span>
      )}
      {shouldShowReplies && (
        <span data-testid='message-livestream-thread-action' onClick={handleOpenThread}>
          <ThreadIcon />
        </span>
      )}
      {showActionsBox && <MessageActions inline />}
    </div>
  );
};

const MemoizedMessageLivestream = React.memo(
  MessageLivestreamWithContext,
  areMessageUIPropsEqual,
) as typeof MessageLivestreamWithContext;

/**
 * @deprecated - This UI component will be removed in the next major release.
 *
 * Handles the rendering of a message and depends on the Message component for all the logic.
 * Implements the look and feel for a livestream use case.
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
  const messageContext = useMessageContext<At, Ch, Co, Ev, Me, Re, Us>('MessageLivestream');

  const messageWrapperRef = useRef<HTMLDivElement | null>(null);
  const reactionSelectorRef = useRef<HTMLDivElement | null>(null);

  const message = props.message || messageContext.message;

  const { isReactionEnabled, onReactionListClick, showDetailedReactions } = useReactionClick(
    message,
    reactionSelectorRef,
    messageWrapperRef,
  );

  return (
    <MemoizedMessageLivestream
      {...messageContext}
      isReactionEnabled={isReactionEnabled}
      messageWrapperRef={messageWrapperRef}
      onReactionListClick={onReactionListClick}
      reactionSelectorRef={reactionSelectorRef}
      showDetailedReactions={showDetailedReactions}
      {...props}
    />
  );
};
