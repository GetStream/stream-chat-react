import React, { useRef } from 'react';

import { MessageDeleted as DefaultMessageDeleted } from './MessageDeleted';
import { MessageOptions } from './MessageOptions';
import { MessageRepliesCountButton } from './MessageRepliesCountButton';
import { MessageText } from './MessageText';
import { MessageTimestamp } from './MessageTimestamp';
import { useReactionClick } from './hooks';
import { DeliveredCheckIcon } from './icons';
import {
  areMessageUIPropsEqual,
  getReadByTooltipText,
  messageHasAttachments,
  messageHasReactions,
  showMessageActionsBox,
} from './utils';

import { Attachment as DefaultAttachment } from '../Attachment';
import { Avatar as DefaultAvatar } from '../Avatar';
import { LoadingIndicator } from '../Loading';
import {
  EditMessageForm as DefaultEditMessageForm,
  MessageInput,
} from '../MessageInput';
import { MML } from '../MML';
import { Modal } from '../Modal';
import {
  ReactionsList as DefaultReactionList,
  ReactionSelector as DefaultReactionSelector,
} from '../Reactions';
import { Tooltip } from '../Tooltip';

import { useChannelContext } from '../../context/ChannelContext';
import { useChatContext } from '../../context/ChatContext';
import { useTranslationContext } from '../../context/TranslationContext';

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

type MessageSimpleWithContextProps<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = Omit<
  MessageUIComponentProps<At, Ch, Co, Ev, Me, Re, Us>,
  'PinIndicator'
> & {
  isReactionEnabled: boolean;
  onReactionListClick: MouseEventHandler;
  reactionSelectorRef: React.MutableRefObject<HTMLDivElement | null>;
  showDetailedReactions: boolean;
};

const MessageSimpleWithContext = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  props: MessageSimpleWithContextProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const {
    additionalMessageInputProps,
    Attachment,
    Avatar = DefaultAvatar,
    clearEditingState,
    editing,
    EditMessageInput = DefaultEditMessageForm,
    formatDate,
    getMessageActions,
    handleAction,
    handleOpenThread,
    handleReaction,
    handleRetry,
    isMyMessage,
    isReactionEnabled,
    message,
    MessageDeleted = DefaultMessageDeleted,
    onReactionListClick,
    onUserClick,
    onUserHover,
    ReactionSelector = DefaultReactionSelector,
    reactionSelectorRef,
    ReactionsList = DefaultReactionList,
    showDetailedReactions,
    threadList,
  } = props;

  const messageWrapperRef = useRef<HTMLDivElement | null>(null);

  const hasAttachment = messageHasAttachments(message);
  const hasReactions = messageHasReactions(message);

  const messageClasses = isMyMessage()
    ? 'str-chat__message str-chat__message--me str-chat__message-simple str-chat__message-simple--me'
    : 'str-chat__message str-chat__message-simple';

  const showActionsBox = showMessageActionsBox(getMessageActions());

  if (message.type === 'message.read' || message.type === 'message.date') {
    return null;
  }

  if (message.deleted_at) {
    return <MessageDeleted message={message} />;
  }

  return (
    <>
      {editing && (
        <Modal onClose={clearEditingState} open={editing}>
          <MessageInput
            clearEditingState={clearEditingState}
            Input={EditMessageInput}
            message={message}
            {...additionalMessageInputProps}
          />
        </Modal>
      )}
      {message && (
        <div
          className={`
						${messageClasses}
						str-chat__message--${message.type}
						str-chat__message--${message.status}
						${message.text ? 'str-chat__message--has-text' : 'has-no-text'}
						${hasAttachment ? 'str-chat__message--has-attachment' : ''}
            ${
              hasReactions && isReactionEnabled
                ? 'str-chat__message--with-reactions'
                : ''
            }
            ${message.pinned ? 'pinned-message' : ''}
					`.trim()}
          key={message.id || ''}
          ref={messageWrapperRef}
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
            className='str-chat__message-inner'
            data-testid='message-inner'
            onClick={
              message.status === 'failed' && message.errorStatusCode !== 403
                ? () => handleRetry(message)
                : undefined
            }
          >
            {!message.text && (
              <>
                {
                  <MessageOptions
                    {...props}
                    handleOpenThread={handleOpenThread}
                    messageWrapperRef={messageWrapperRef}
                    onReactionListClick={onReactionListClick}
                  />
                }
                {hasReactions &&
                  !showDetailedReactions &&
                  isReactionEnabled && (
                    <ReactionsList
                      onClick={onReactionListClick}
                      own_reactions={message.own_reactions}
                      reaction_counts={message.reaction_counts || undefined}
                      reactions={message.latest_reactions}
                      reverse={true}
                    />
                  )}
                {showDetailedReactions && isReactionEnabled && (
                  <ReactionSelector
                    detailedView
                    handleReaction={handleReaction}
                    latest_reactions={message.latest_reactions}
                    own_reactions={message.own_reactions}
                    reaction_counts={message.reaction_counts || undefined}
                    ref={reactionSelectorRef}
                  />
                )}
              </>
            )}
            {message.attachments && Attachment && (
              <Attachment
                actionHandler={handleAction}
                attachments={message.attachments}
              />
            )}
            {message.text && (
              <MessageText
                {...props}
                customOptionProps={{
                  displayActions: showActionsBox,
                  handleOpenThread,
                  messageWrapperRef,
                }}
              />
            )}
            {message.mml && (
              <MML
                actionHandler={handleAction}
                align={isMyMessage() ? 'right' : 'left'}
                source={message.mml}
              />
            )}
            {!threadList && message.reply_count !== 0 && (
              <div className='str-chat__message-simple-reply-button'>
                <MessageRepliesCountButton
                  onClick={handleOpenThread}
                  reply_count={message.reply_count}
                />
              </div>
            )}
            <div
              className={`str-chat__message-data str-chat__message-simple-data`}
            >
              {!isMyMessage() && message.user ? (
                <span className='str-chat__message-simple-name'>
                  {message.user.name || message.user.id}
                </span>
              ) : null}
              <MessageTimestamp
                calendar
                customClass='str-chat__message-simple-timestamp'
                formatDate={formatDate}
                message={message}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const MessageSimpleStatus = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>({
  Avatar = DefaultAvatar,
  isMyMessage,
  readBy,
  message,
  threadList,
  lastReceivedId,
}: MessageUIComponentProps<At, Ch, Co, Ev, Me, Re, Us>) => {
  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { t } = useTranslationContext();

  if (!isMyMessage() || message.type === 'error') {
    return null;
  }

  const justReadByMe =
    readBy &&
    readBy.length === 1 &&
    readBy[0] &&
    client &&
    readBy[0].id === client.user?.id;

  if (message && message.status === 'sending') {
    return (
      <span
        className='str-chat__message-simple-status'
        data-testid='message-status-sending'
      >
        <Tooltip>{t('Sending...')}</Tooltip>
        <LoadingIndicator />
      </span>
    );
  }

  if (readBy && readBy.length !== 0 && !threadList && !justReadByMe) {
    const lastReadUser = readBy.filter(
      (item) => !!item && !!client && item.id !== client.user?.id,
    )[0];
    return (
      <span
        className='str-chat__message-simple-status'
        data-testid='message-status-read-by'
      >
        <Tooltip>{readBy && getReadByTooltipText(readBy, t, client)}</Tooltip>
        <Avatar
          image={lastReadUser?.image}
          name={lastReadUser?.name}
          size={15}
        />
        {readBy.length > 2 && (
          <span
            className='str-chat__message-simple-status-number'
            data-testid='message-status-read-by-many'
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
        className='str-chat__message-simple-status'
        data-testid='message-status-received'
      >
        <Tooltip>{t('Delivered')}</Tooltip>
        <DeliveredCheckIcon />
      </span>
    );
  }

  return null;
};

const MemoizedMessageSimple = React.memo(
  MessageSimpleWithContext,
  areMessageUIPropsEqual,
) as typeof MessageSimpleWithContext;

/**
 * MessageSimple - UI component that renders a message and receives functionality and logic from the Message/MessageList components.
 * @example ./MessageSimple.md
 */
export const MessageSimple = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  props: Omit<
    MessageUIComponentProps<At, Ch, Co, Ev, Me, Re, Us>,
    'PinIndicator'
  >,
) => {
  const { Attachment: PropAttachment, message } = props;

  const { Attachment: ContextAttachment } = useChannelContext<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >();

  const reactionSelectorRef = useRef<HTMLDivElement | null>(null);

  const {
    isReactionEnabled,
    onReactionListClick,
    showDetailedReactions,
  } = useReactionClick(message, reactionSelectorRef);

  const Attachment = PropAttachment || ContextAttachment || DefaultAttachment;

  return (
    <MemoizedMessageSimple
      {...props}
      Attachment={Attachment}
      isReactionEnabled={isReactionEnabled}
      onReactionListClick={onReactionListClick}
      reactionSelectorRef={reactionSelectorRef}
      showDetailedReactions={showDetailedReactions}
    />
  );
};
