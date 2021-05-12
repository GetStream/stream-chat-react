import React, { useMemo, useRef } from 'react';

import { MessageDeleted as DefaultMessageDeleted } from './MessageDeleted';
import { MessageRepliesCountButton as DefaultMessageRepliesCountButton } from './MessageRepliesCountButton';
import { MessageStatus } from './MessageStatus';
import { MessageTimestamp as DefaultTimestamp } from './MessageTimestamp';
import { useReactionClick } from './hooks';
import { PinIndicator as DefaultPinIndicator, ErrorIcon, ReactionIcon, ThreadIcon } from './icons';
import { QuotedMessage as DefaultQuotedMessage } from './QuotedMessage';
import { areMessageUIPropsEqual, showMessageActionsBox } from './utils';

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
} from '../../../types/types';

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
    channelConfig,
    clearEditingState,
    editing,
    getMessageActions,
    groupStyles,
    handleAction,
    handleOpenThread,
    handleReaction,
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
  } = useComponentContext<At, Ch, Co, Ev, Me, Re, Us>();

  const { t, userLanguage } = useTranslationContext();

  const showActionsBox = showMessageActionsBox(getMessageActions());

  const messageTextToRender =
    message.i18n?.[`${userLanguage}_text` as `${TranslationLanguages}_text`] || message.text;

  const messageMentionedUsersItem = message.mentioned_users;

  const messageText = useMemo(() => renderText(messageTextToRender, messageMentionedUsersItem), [
    messageMentionedUsersItem,
    messageTextToRender,
  ]);

  const firstGroupStyle = groupStyles ? groupStyles[0] : 'single';

  if (message.type === 'message.read') {
    return null;
  }

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
                  {showDetailedReactions && (
                    <ReactionSelector
                      detailedView={true}
                      handleReaction={handleReaction}
                      latest_reactions={message.latest_reactions}
                      own_reactions={message.own_reactions}
                      reaction_counts={message.reaction_counts || undefined}
                      ref={reactionSelectorRef}
                    />
                  )}
                  {isReactionEnabled && (
                    <span
                      data-testid='message-team-reaction-icon'
                      onClick={onReactionListClick}
                      title='Reactions'
                    >
                      <ReactionIcon />
                    </span>
                  )}
                  {!threadList && channelConfig?.replies !== false && (
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
            {!message.text && message.attachments && (
              <Attachment actionHandler={handleAction} attachments={message.attachments} />
            )}
            {message.latest_reactions?.length !== 0 && message.text !== '' && isReactionEnabled && (
              <ReactionsList
                handleReaction={handleReaction}
                onClick={onReactionListClick}
                own_reactions={message.own_reactions}
                reaction_counts={message.reaction_counts || undefined}
                reactions={message.latest_reactions}
              />
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
          {message.text && message.attachments && (
            <Attachment actionHandler={handleAction} attachments={message.attachments} />
          )}
          {message.latest_reactions &&
            message.latest_reactions.length !== 0 &&
            message.text === '' &&
            isReactionEnabled && (
              <ReactionsList
                handleReaction={handleReaction}
                onClick={onReactionListClick}
                own_reactions={message.own_reactions}
                reaction_counts={message.reaction_counts || undefined}
                reactions={message.latest_reactions}
              />
            )}
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
 * MessageTeam - handles the rendering of a Message and depends on the Message component for all the logic.
 * Implements the look and feel for a team style collaboration environment.
 * @example ./MessageTeam.md
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
  const messageContext = useMessageContext<At, Ch, Co, Ev, Me, Re, Us>();

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
