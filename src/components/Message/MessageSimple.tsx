import React, { useRef } from 'react';

import { MessageDeleted as DefaultMessageDeleted } from './MessageDeleted';
import { MessageOptions } from './MessageOptions';
import { MessageRepliesCountButton } from './MessageRepliesCountButton';
import { MessageText } from './MessageText';
import { MessageTimestamp } from './MessageTimestamp';
import { DeliveredCheckIcon } from './icons';
import {
  areMessageUIPropsEqual,
  getReadByTooltipText,
  messageHasAttachments,
  messageHasReactions,
  showMessageActionsBox,
} from './utils';

import { AvatarProps, Avatar as DefaultAvatar } from '../Avatar';
import { LoadingIndicator } from '../Loading';
import { EditMessageForm as DefaultEditMessageForm, MessageInput } from '../MessageInput';
import { MML } from '../MML';
import { Modal } from '../Modal';
import {
  ReactionsList as DefaultReactionList,
  ReactionSelector as DefaultReactionSelector,
} from '../Reactions';
import { Tooltip } from '../Tooltip';

import { useChatContext } from '../../context/ChatContext';
import { useComponentContext } from '../../context/ComponentContext';
import { MessageContextValue, useMessageContext } from '../../context/MessageContext';
import { useTranslationContext } from '../../context/TranslationContext';

import type { MessageUIComponentProps } from './types';

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
> = MessageContextValue<At, Ch, Co, Ev, Me, Re, Us>;

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
    clearEditingState,
    editing,
    getMessageActions,
    handleAction,
    handleOpenThread,
    handleRetry,
    isMyMessage,
    isReactionEnabled,
    message,
    onUserClick,
    onUserHover,
    reactionSelectorRef,
    showDetailedReactions,
    threadList,
  } = props;

  const {
    Attachment,
    Avatar = DefaultAvatar,
    EditMessageInput = DefaultEditMessageForm,
    MessageDeleted = DefaultMessageDeleted,
    ReactionSelector = DefaultReactionSelector,
    ReactionsList = DefaultReactionList,
  } = useComponentContext<At, Ch, Co, Ev, Me, Re, Us>();

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
      {
        <div
          className={`
						${messageClasses}
						str-chat__message--${message.type}
						str-chat__message--${message.status}
						${message.text ? 'str-chat__message--has-text' : 'has-no-text'}
						${hasAttachment ? 'str-chat__message--has-attachment' : ''}
            ${hasReactions && isReactionEnabled ? 'str-chat__message--with-reactions' : ''}
            ${message.pinned ? 'pinned-message' : ''}
					`.trim()}
          key={message.id || ''}
          ref={messageWrapperRef}
        >
          <MessageSimpleStatus Avatar={Avatar} />
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
                <MessageOptions messageWrapperRef={messageWrapperRef} />
                {hasReactions && !showDetailedReactions && isReactionEnabled && (
                  <ReactionsList
                    own_reactions={message.own_reactions}
                    reaction_counts={message.reaction_counts || undefined}
                    reactions={message.latest_reactions}
                    reverse
                  />
                )}
                {showDetailedReactions && isReactionEnabled && (
                  <ReactionSelector
                    detailedView
                    latest_reactions={message.latest_reactions}
                    own_reactions={message.own_reactions}
                    reaction_counts={message.reaction_counts || undefined}
                    ref={reactionSelectorRef}
                  />
                )}
              </>
            )}
            {message.attachments && (
              <Attachment actionHandler={handleAction} attachments={message.attachments} />
            )}
            {message.text && (
              <MessageText
                customOptionProps={{
                  displayActions: showActionsBox,
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
            {!threadList && !!message.reply_count && (
              <div className='str-chat__message-simple-reply-button'>
                <MessageRepliesCountButton
                  onClick={handleOpenThread}
                  reply_count={message.reply_count}
                />
              </div>
            )}
            <div className={`str-chat__message-data str-chat__message-simple-data`}>
              {!isMyMessage() && message.user ? (
                <span className='str-chat__message-simple-name'>
                  {message.user.name || message.user.id}
                </span>
              ) : null}
              <MessageTimestamp calendar customClass='str-chat__message-simple-timestamp' />
            </div>
          </div>
        </div>
      }
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
  Avatar,
}: {
  Avatar: React.ComponentType<AvatarProps>;
}) => {
  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { isMyMessage, lastReceivedId, message, readBy, threadList } = useMessageContext<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >();
  const { t } = useTranslationContext();

  if (!isMyMessage() || message.type === 'error') {
    return null;
  }

  const justReadByMe = readBy?.length === 1 && readBy[0].id === client.user?.id;

  if (message.status === 'sending') {
    return (
      <span className='str-chat__message-simple-status' data-testid='message-status-sending'>
        <Tooltip>{t('Sending...')}</Tooltip>
        <LoadingIndicator />
      </span>
    );
  }

  if (readBy?.length && !threadList && !justReadByMe) {
    const lastReadUser = readBy.filter((item) => item.id !== client.user?.id)[0];

    return (
      <span className='str-chat__message-simple-status' data-testid='message-status-read-by'>
        <Tooltip>{getReadByTooltipText(readBy, t, client)}</Tooltip>
        <Avatar image={lastReadUser?.image} name={lastReadUser?.name} size={15} />
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

  if (message.status === 'received' && message.id === lastReceivedId && !threadList) {
    return (
      <span className='str-chat__message-simple-status' data-testid='message-status-received'>
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
  props: MessageUIComponentProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const messageContext = useMessageContext<At, Ch, Co, Ev, Me, Re, Us>();

  return <MemoizedMessageSimple {...messageContext} {...props} />;
};
