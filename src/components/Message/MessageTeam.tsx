import React, { useMemo, useRef } from 'react';

import { MessageDeleted as DefaultMessageDeleted } from './MessageDeleted';
import { MessageRepliesCountButton as DefaultMessageRepliesCountButton } from './MessageRepliesCountButton';
import { MessageStatus } from './MessageStatus';
import { MessageTimestamp as DefaultTimestamp } from './MessageTimestamp';
import { useReactionClick } from './hooks';
import { PinIndicator as DefaultPinIndicator, ErrorIcon, ReactionIcon, ThreadIcon } from './icons';
import { QuotedMessage as DefaultQuotedMessage } from './QuotedMessage';
import { areMessageUIPropsEqual, MESSAGE_ACTIONS, showMessageActionsBox } from './utils';

import { Avatar as DefaultAvatar } from '../Avatar';
import { MessageActions } from '../MessageActions';
import { EditMessageForm as DefaultEditMessageForm, MessageInput } from '../MessageInput';
import { MML } from '../MML';
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

type MessageTeamWithContextProps<
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

const MessageTeamWithContext = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  props: MessageTeamWithContextProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    clearEditingState,
    editing,
    getMessageActions,
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
    threadList,
    unsafeHTML,
  } = props;

  const {
    Attachment,
    Avatar = DefaultAvatar,
    EditMessageInput = DefaultEditMessageForm,
    MessageDeleted = DefaultMessageDeleted,
    MessageRepliesCountButton = DefaultMessageRepliesCountButton,
    MessageTimestamp = DefaultTimestamp,
    PinIndicator = DefaultPinIndicator,
    QuotedMessage = DefaultQuotedMessage,
    ReactionsList = DefaultReactionsList,
    ReactionSelector = DefaultReactionSelector,
  } = useComponentContext<At, Ch, Co, Ev, Me, Re, Us>('MessageTeam');

  const { t, userLanguage } = useTranslationContext('MessageTeam');

  const messageActions = getMessageActions();
  const showActionsBox = showMessageActionsBox(messageActions);

  const shouldShowReplies = messageActions.indexOf(MESSAGE_ACTIONS.reply) > -1 && !threadList;

  const messageTextToRender =
    message.i18n?.[`${userLanguage}_text` as `${TranslationLanguages}_text`] || message.text;

  const messageMentionedUsersItem = message.mentioned_users;

  const messageText = useMemo(() => renderText(messageTextToRender, messageMentionedUsersItem), [
    messageMentionedUsersItem,
    messageTextToRender,
  ]);

  const firstGroupStyle = groupStyles ? groupStyles[0] : 'single';

  if (message.deleted_at) {
    return <MessageDeleted message={message} />;
  }

  if (editing) {
    return (
      <div
        className={`str-chat__message-team str-chat__message-team--${firstGroupStyle} str-chat__message-team--editing`}
        data-testid='message-team-edit'
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
        <div className='str-chat__message-team-pin-indicator'>
          <PinIndicator message={message} t={t} />
        </div>
      )}
      <div
        className={`str-chat__message-team str-chat__message-team--${firstGroupStyle} str-chat__message-team--${
          message.type
        } ${threadList ? 'thread-list' : ''} str-chat__message-team--${message.status} ${
          message.pinned ? 'pinned-message' : ''
        }`}
        data-testid='message-team'
        ref={messageWrapperRef}
      >
        <div className='str-chat__message-team-meta'>
          {firstGroupStyle === 'top' || firstGroupStyle === 'single' || initialMessage ? (
            <Avatar
              image={message.user?.image}
              name={message.user?.name || message.user?.id}
              onClick={onUserClick}
              onMouseOver={onUserHover}
              size={40}
            />
          ) : (
            <div data-testid='team-meta-spacer' style={{ marginRight: 0, width: 40 }} />
          )}
          <MessageTimestamp />
        </div>
        <div className='str-chat__message-team-group'>
          {(firstGroupStyle === 'top' || firstGroupStyle === 'single' || initialMessage) && (
            <div
              className='str-chat__message-team-author'
              data-testid='message-team-author'
              onClick={onUserClick}
            >
              <strong>{message.user?.name || message.user?.id}</strong>
              {message.type === 'error' && (
                <div className='str-chat__message-team-error-header'>
                  {t('Only visible to you')}
                </div>
              )}
            </div>
          )}
          <div
            className={`str-chat__message-team-content str-chat__message-team-content--${firstGroupStyle} str-chat__message-team-content--${
              message.text === '' ? 'image' : 'text'
            }`}
            data-testid='message-team-content'
          >
            {message.quoted_message && <QuotedMessage />}
            {!initialMessage &&
              message.status !== 'sending' &&
              message.status !== 'failed' &&
              message.type !== 'system' &&
              message.type !== 'ephemeral' &&
              message.type !== 'error' && (
                <div
                  className={`str-chat__message-team-actions`}
                  data-testid='message-team-actions'
                >
                  {showDetailedReactions && <ReactionSelector ref={reactionSelectorRef} />}
                  {isReactionEnabled && (
                    <span
                      data-testid='message-team-reaction-icon'
                      onClick={onReactionListClick}
                      title='Reactions'
                    >
                      <ReactionIcon />
                    </span>
                  )}
                  {shouldShowReplies && (
                    <span
                      data-testid='message-team-thread-icon'
                      onClick={handleOpenThread}
                      title='Start a thread'
                    >
                      <ThreadIcon />
                    </span>
                  )}
                  {showActionsBox && (
                    <MessageActions inline messageWrapperRef={messageWrapperRef} />
                  )}
                </div>
              )}
            {
              <span
                className={
                  isOnlyEmojis(message.text) ? 'str-chat__message-team-text--is-emoji' : ''
                }
                data-testid='message-team-message'
                onClick={onMentionsClickMessage}
                onMouseOver={onMentionsHoverMessage}
              >
                {unsafeHTML && message.html ? (
                  <div dangerouslySetInnerHTML={{ __html: message.html }} />
                ) : (
                  messageText
                )}
              </span>
            }
            {message.mml && <MML actionHandler={handleAction} align='left' source={message.mml} />}
            {!message.text && message.attachments?.length ? (
              <Attachment actionHandler={handleAction} attachments={message.attachments} />
            ) : null}
            {message.latest_reactions?.length !== 0 && message.text !== '' && isReactionEnabled && (
              <ReactionsList />
            )}
            {message.status === 'failed' && (
              <button
                className='str-chat__message-team-failed'
                data-testid='message-team-failed'
                onClick={message.errorStatusCode !== 403 ? () => handleRetry(message) : undefined}
              >
                <ErrorIcon />
                {message.errorStatusCode !== 403
                  ? t('Message Failed · Click to try again')
                  : t('Message Failed · Unauthorized')}
              </button>
            )}
          </div>
          <MessageStatus messageType='team' />
          {message.text && message.attachments?.length ? (
            <Attachment actionHandler={handleAction} attachments={message.attachments} />
          ) : null}
          {message.latest_reactions &&
            message.latest_reactions.length !== 0 &&
            message.text === '' &&
            isReactionEnabled && <ReactionsList />}
          {!threadList && (
            <MessageRepliesCountButton
              onClick={handleOpenThread}
              reply_count={message.reply_count}
            />
          )}
        </div>
      </div>
    </>
  );
};

const MemoizedMessageTeam = React.memo(
  MessageTeamWithContext,
  areMessageUIPropsEqual,
) as typeof MessageTeamWithContext;

/**
 * @deprecated - This UI component will be removed in the next major release.
 *
 * Handles the rendering of a Message and depends on the Message component for all the logic.
 * Implements the look and feel for a team style collaboration environment.
 */
export const MessageTeam = <
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
  const messageContext = useMessageContext<At, Ch, Co, Ev, Me, Re, Us>('MessageTeam');

  const reactionSelectorRef = useRef<HTMLDivElement | null>(null);
  const messageWrapperRef = useRef<HTMLDivElement | null>(null);

  const message = props.message || messageContext.message;

  const { isReactionEnabled, onReactionListClick, showDetailedReactions } = useReactionClick(
    message,
    reactionSelectorRef,
    messageWrapperRef,
  );

  return (
    <MemoizedMessageTeam
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
