import React from 'react';

import { MessageDeleted as DefaultMessageDeleted } from './MessageDeleted';
import { MessageOptions as DefaultMessageOptions } from './MessageOptions';
import { MessageRepliesCountButton as DefaultMessageRepliesCountButton } from './MessageRepliesCountButton';
import { MessageStatus as DefaultMessageStatus } from './MessageStatus';
import { MessageText } from './MessageText';
import { MessageTimestamp as DefaultMessageTimestamp } from './MessageTimestamp';
import { areMessageUIPropsEqual, messageHasAttachments, messageHasReactions } from './utils';

import { Avatar as DefaultAvatar } from '../Avatar';
import { CUSTOM_MESSAGE_TYPE } from '../../constants/messageTypes';
import { EditMessageForm as DefaultEditMessageForm, MessageInput } from '../MessageInput';
import { MML } from '../MML';
import { Modal } from '../Modal';
import {
  ReactionsList as DefaultReactionList,
  ReactionSelector as DefaultReactionSelector,
} from '../Reactions';

import { useComponentContext } from '../../context/ComponentContext';
import { useChannelActionContext } from '../../context/ChannelActionContext';
import { MessageContextValue, useMessageContext } from '../../context/MessageContext';
import { useTranslationContext } from '../../context/TranslationContext';

import type { MessageUIComponentProps } from './types';

import type { DefaultStreamChatGenerics } from '../../types/types';

type MessageSimpleWithContextProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = MessageContextValue<StreamChatGenerics>;

export const MODERATION_ERROR_CODE = 73;
const MessageSimpleWithContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  props: MessageSimpleWithContextProps<StreamChatGenerics>,
) => {
  const {
    additionalMessageInputProps,
    clearEditingState,
    editing,
    endOfGroup,
    firstOfGroup,
    groupedByUser,
    handleAction,
    handleOpenThread,
    handleRetry,
    highlighted,
    isMyMessage,
    isReactionEnabled,
    message,
    onUserClick,
    onUserHover,
    reactionSelectorRef,
    setEditingState,
    showDetailedReactions,
    threadList,
  } = props;

  const {
    Attachment,
    Avatar = DefaultAvatar,
    EditMessageInput = DefaultEditMessageForm,
    MessageDeleted = DefaultMessageDeleted,
    MessageOptions = DefaultMessageOptions,
    MessageRepliesCountButton = DefaultMessageRepliesCountButton,
    MessageStatus = DefaultMessageStatus,
    MessageTimestamp = DefaultMessageTimestamp,
    ReactionSelector = DefaultReactionSelector,
    ReactionsList = DefaultReactionList,
  } = useComponentContext<StreamChatGenerics>('MessageSimple');

  const { removeMessage } = useChannelActionContext<StreamChatGenerics>('useSubmitHandler');

  const { t } = useTranslationContext('MessageText');

  const hasAttachment = messageHasAttachments(message);
  const hasReactions = messageHasReactions(message);

  const messageClasses = isMyMessage()
    ? 'str-chat__message str-chat__message--me str-chat__message-simple str-chat__message-simple--me'
    : 'str-chat__message str-chat__message-simple';

  if (message.customType === CUSTOM_MESSAGE_TYPE.date) {
    return null;
  }

  if (message.deleted_at || message.type === 'deleted') {
    return <MessageDeleted message={message} />;
  }

  return (
    <>
      {editing && (
        <Modal onClose={clearEditingState} open={editing}>
          <MessageInput
            clearEditingState={clearEditingState}
            focus
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
            ${highlighted ? 'str-chat__message--highlighted' : ''}
            ${message.pinned ? 'pinned-message' : ''}
            ${groupedByUser ? 'str-chat__virtual-message__wrapper--group' : ''}
            ${firstOfGroup ? 'str-chat__virtual-message__wrapper--first' : ''}
            ${endOfGroup ? 'str-chat__virtual-message__wrapper--end' : ''}
					`.trim()}
          key={message.id}
        >
          <MessageStatus />
          {message.user && (
            <Avatar
              image={message.user.image}
              name={message.user.name || message.user.id}
              onClick={onUserClick}
              onMouseOver={onUserHover}
              user={message.user}
            />
          )}
          <div
            className='str-chat__message-inner'
            data-testid='message-inner'
            onClick={
              message.status === 'failed' &&
              message.errorStatusCode !== 403 &&
              message.error?.code !== MODERATION_ERROR_CODE
                ? () => handleRetry(message)
                : undefined
            }
          >
            <>
              <MessageOptions />
              {hasReactions && !showDetailedReactions && isReactionEnabled && (
                <ReactionsList reverse />
              )}
              {showDetailedReactions && isReactionEnabled && (
                <ReactionSelector ref={reactionSelectorRef} />
              )}
            </>
            {message.attachments?.length && !message.quoted_message ? (
              <Attachment actionHandler={handleAction} attachments={message.attachments} />
            ) : null}
            <MessageText message={message} />
            {message.error?.code === MODERATION_ERROR_CODE && (
              <div className='str-chat__message-moderation-error-actions-box'>
                <button onClick={() => removeMessage(message)}>{t<string>('Remove')}</button>

                <button onClick={() => handleRetry(message)}>{t<string>('Send anyway')}</button>

                <button
                  className='str-chat__message-moderation-error-actions-box--primary'
                  onClick={(e) => setEditingState(e)}
                >
                  {t<string>('Edit')}
                </button>
              </div>
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
            {(!groupedByUser || endOfGroup) && (
              <div className={`str-chat__message-data str-chat__message-simple-data`}>
                {!isMyMessage() && message.user ? (
                  <span className='str-chat__message-simple-name'>
                    {message.user.name || message.user.id}
                  </span>
                ) : null}
                <MessageTimestamp calendar customClass='str-chat__message-simple-timestamp' />
              </div>
            )}
          </div>
        </div>
      }
    </>
  );
};

const MemoizedMessageSimple = React.memo(
  MessageSimpleWithContext,
  areMessageUIPropsEqual,
) as typeof MessageSimpleWithContext;

/**
 * The default UI component that renders a message and receives functionality and logic from the MessageContext.
 */
export const MessageSimple = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  props: MessageUIComponentProps<StreamChatGenerics>,
) => {
  const messageContext = useMessageContext<StreamChatGenerics>('MessageSimple');

  return <MemoizedMessageSimple {...messageContext} {...props} />;
};
