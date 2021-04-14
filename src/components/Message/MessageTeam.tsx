import React, { useMemo, useRef } from 'react';

import { MessageDeleted as DefaultMessageDeleted } from './MessageDeleted';
import { MessageRepliesCountButton } from './MessageRepliesCountButton';
import { MessageTimestamp } from './MessageTimestamp';
import { useReactionClick } from './hooks';
import {
  PinIndicator as DefaultPinIndicator,
  DeliveredCheckIcon,
  ErrorIcon,
  ReactionIcon,
  ThreadIcon,
} from './icons';
import { areMessageUIPropsEqual, getReadByTooltipText, showMessageActionsBox } from './utils';

import { AvatarProps, Avatar as DefaultAvatar } from '../Avatar';
import { LoadingIndicator } from '../Loading';
import { MessageActions } from '../MessageActions';
import { EditMessageForm as DefaultEditMessageForm, MessageInput } from '../MessageInput';
import { MML } from '../MML';
import {
  ReactionSelector as DefaultReactionSelector,
  SimpleReactionsList as DefaultReactionsList,
} from '../Reactions';
import { Tooltip } from '../Tooltip';

import { useChatContext } from '../../context/ChatContext';
import { ComponentContextValue, useComponentContext } from '../../context/ComponentContext';
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
    groupStyles = ['single'],
    handleAction,
    handleOpenThread,
    handleReaction,
    handleRetry,
    initialMessage,
    isMyMessage,
    isReactionEnabled,
    lastReceivedId,
    message,
    messageWrapperRef,
    onMentionsClickMessage,
    onMentionsHoverMessage,
    onReactionListClick,
    onUserClick,
    onUserHover,
    reactionSelectorRef,
    readBy,
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
    PinIndicator = DefaultPinIndicator,
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

  const firstGroupStyle = groupStyles ? groupStyles[0] : '';

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
          {message &&
            (firstGroupStyle === 'top' || firstGroupStyle === 'single' || initialMessage) && (
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
            {!initialMessage &&
              message &&
              message.status !== 'sending' &&
              message.status !== 'failed' &&
              message.type !== 'system' &&
              message.type !== 'ephemeral' &&
              message.type !== 'error' && (
                <div
                  className={`str-chat__message-team-actions`}
                  data-testid='message-team-actions'
                >
                  {message && showDetailedReactions && (
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
            {message && (
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
            )}
            {message.mml && <MML actionHandler={handleAction} align='left' source={message.mml} />}
            {message.text === '' && (
              <MessageTeamAttachments
                Attachment={Attachment}
                handleAction={handleAction}
                message={message}
              />
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
          <MessageTeamStatus
            Avatar={Avatar}
            isMyMessage={isMyMessage}
            lastReceivedId={lastReceivedId}
            message={message}
            readBy={readBy}
            threadList={threadList}
          />
          {message.text !== '' && message.attachments && (
            <MessageTeamAttachments
              Attachment={Attachment}
              handleAction={handleAction}
              message={message}
            />
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

const MessageTeamStatus = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  props: Pick<
    MessageContextValue<At, Ch, Co, Ev, Me, Re, Us>,
    'isMyMessage' | 'lastReceivedId' | 'message' | 'readBy' | 'threadList'
  > & { Avatar: React.ComponentType<AvatarProps> },
) => {
  const { Avatar, isMyMessage, lastReceivedId, message, readBy, threadList } = props;

  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { t } = useTranslationContext();

  if (!isMyMessage() || message.type === 'error') {
    return null;
  }

  const justReadByMe =
    readBy && client?.user && readBy.length === 1 && readBy[0] && readBy[0].id === client.user.id;

  if (message && message.status === 'sending') {
    return (
      <span className='str-chat__message-team-status' data-testid='message-team-sending'>
        <Tooltip>{t('Sending...')}</Tooltip>
        <LoadingIndicator />
      </span>
    );
  }

  if (readBy && readBy.length !== 0 && !threadList && !justReadByMe) {
    const lastReadUser = readBy.filter(
      (item) => item && client?.user && item.id !== client.user.id,
    )[0];
    return (
      <span className='str-chat__message-team-status'>
        <Tooltip>{getReadByTooltipText(readBy, t, client)}</Tooltip>
        <Avatar image={lastReadUser?.image} name={lastReadUser?.name} size={15} />
        {readBy.length - 1 > 1 && (
          <span
            className='str-chat__message-team-status-number'
            data-testid='message-team-read-by-count'
          >
            {readBy.length - 1}
          </span>
        )}
      </span>
    );
  }

  if (message && message.status === 'received' && message.id === lastReceivedId && !threadList) {
    return (
      <span className='str-chat__message-team-status' data-testid='message-team-received'>
        <Tooltip>{t('Delivered')}</Tooltip>
        <DeliveredCheckIcon />
      </span>
    );
  }

  return null;
};

const MessageTeamAttachments = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  props: Pick<MessageContextValue<At, Ch, Co, Ev, Me, Re, Us>, 'handleAction' | 'message'> & {
    Attachment: ComponentContextValue<At>['Attachment'];
  },
) => {
  const { Attachment, handleAction, message } = props;

  if (message.attachments) {
    return <Attachment actionHandler={handleAction} attachments={message.attachments} />;
  }

  return null;
};

const MemoizedMessageTeam = React.memo(
  MessageTeamWithContext,
  areMessageUIPropsEqual,
) as typeof MessageTeamWithContext;

/**
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
