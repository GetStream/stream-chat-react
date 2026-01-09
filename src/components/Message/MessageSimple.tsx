import React, { useMemo, useState } from 'react';
import clsx from 'clsx';

import { MessageErrorIcon } from './icons';
import { MessageBouncePrompt as DefaultMessageBouncePrompt } from '../MessageBounce';
import { MessageDeleted as DefaultMessageDeleted } from './MessageDeleted';
import { MessageBlocked as DefaultMessageBlocked } from './MessageBlocked';
import { MessageActions as DefaultMessageActions } from '../MessageActions';
import { MessageRepliesCountButton as DefaultMessageRepliesCountButton } from './MessageRepliesCountButton';
import { MessageStatus as DefaultMessageStatus } from './MessageStatus';
import { MessageText } from './MessageText';
import { MessageTimestamp as DefaultMessageTimestamp } from './MessageTimestamp';
import { StreamedMessageText as DefaultStreamedMessageText } from './StreamedMessageText';
import { isDateSeparatorMessage } from '../MessageList';
import { MessageIsThreadReplyInChannelButtonIndicator as DefaultMessageIsThreadReplyInChannelButtonIndicator } from './MessageIsThreadReplyInChannelButtonIndicator';
import { ReminderNotification as DefaultReminderNotification } from './ReminderNotification';
import { useMessageReminder } from './hooks';
import {
  areMessageUIPropsEqual,
  isMessageBlocked,
  isMessageBounced,
  isMessageEdited,
  isOnlyEmojis,
  messageHasAttachments,
  messageHasReactions,
  messageHasSingleAttachment,
} from './utils';

import { Avatar as DefaultAvatar } from '../Avatar';
import { Attachment as DefaultAttachment } from '../Attachment';
import { Poll } from '../Poll';
import { ReactionsList as DefaultReactionList } from '../Reactions';
import { MessageBounceModal } from '../MessageBounce/MessageBounceModal';
import { useComponentContext } from '../../context/ComponentContext';
import type { MessageContextValue } from '../../context/MessageContext';
import { useMessageContext } from '../../context/MessageContext';

import { useChatContext, useTranslationContext } from '../../context';
import { MessageEditedTimestamp } from './MessageEditedTimestamp';

import type { MessageUIComponentProps } from './types';

type MessageSimpleWithContextProps = MessageContextValue;

const MessageSimpleWithContext = (props: MessageSimpleWithContextProps) => {
  const {
    endOfGroup,
    firstOfGroup,
    groupedByUser,
    handleAction,
    handleOpenThread,
    handleRetry,
    highlighted,
    isMessageAIGenerated,
    isMyMessage,
    message,
    onUserClick,
    onUserHover,
    renderText,
    threadList,
  } = props;
  const { client } = useChatContext('MessageSimple');
  const { t } = useTranslationContext('MessageSimple');
  const [isBounceDialogOpen, setIsBounceDialogOpen] = useState(false);
  const [isEditedTimestampOpen, setEditedTimestampOpen] = useState(false);
  const reminder = useMessageReminder(message.id);

  const {
    Attachment = DefaultAttachment,
    Avatar = DefaultAvatar,
    MessageActions = DefaultMessageActions,
    MessageBlocked = DefaultMessageBlocked,
    MessageBouncePrompt = DefaultMessageBouncePrompt,
    MessageDeleted = DefaultMessageDeleted,
    MessageIsThreadReplyInChannelButtonIndicator = DefaultMessageIsThreadReplyInChannelButtonIndicator,
    MessageRepliesCountButton = DefaultMessageRepliesCountButton,
    MessageStatus = DefaultMessageStatus,
    MessageTimestamp = DefaultMessageTimestamp,
    PinIndicator,
    ReactionsList = DefaultReactionList,
    ReminderNotification = DefaultReminderNotification,
    StreamedMessageText = DefaultStreamedMessageText,
  } = useComponentContext('MessageSimple');
  const hasAttachment = messageHasAttachments(message);
  const hasSingleAttachment = messageHasSingleAttachment(message);
  const hasReactions = messageHasReactions(message);
  const isAIGenerated = useMemo(
    () => isMessageAIGenerated?.(message),
    [isMessageAIGenerated, message],
  );
  const finalAttachments = useMemo(
    () =>
      !message.shared_location && !message.attachments
        ? []
        : !message.shared_location
          ? message.attachments
          : [message.shared_location, ...(message.attachments ?? [])],
    [message],
  );

  if (isDateSeparatorMessage(message)) {
    return null;
  }

  if (message.deleted_at || message.type === 'deleted') {
    return <MessageDeleted message={message} />;
  }

  if (isMessageBlocked(message)) {
    return <MessageBlocked />;
  }

  const showMetadata = !groupedByUser || endOfGroup;
  const showReplyCountButton = !threadList && !!message.reply_count;
  const showIsReplyInChannel =
    !threadList && message.show_in_channel && message.parent_id;
  const allowRetry = message.status === 'failed' && message.error?.status !== 403;
  const isBounced = isMessageBounced(message);
  const isEdited = isMessageEdited(message) && !isAIGenerated;

  let handleClick: (() => void) | undefined = undefined;

  if (allowRetry) {
    handleClick = () => handleRetry(message);
  } else if (isBounced) {
    handleClick = () => setIsBounceDialogOpen(true);
  } else if (isEdited) {
    handleClick = () => setEditedTimestampOpen((prev) => !prev);
  }

  const rootClassName = clsx(
    'str-chat__message str-chat__message-simple',
    `str-chat__message--${message.type}`,
    `str-chat__message--${message.status}`,
    isMyMessage()
      ? 'str-chat__message--me str-chat__message-simple--me'
      : 'str-chat__message--other',
    message.text ? 'str-chat__message--has-text' : 'str-chat__message--has-no-text',
    {
      'str-chat__message--has-attachment': hasAttachment,
      'str-chat__message--has-single-attachment': hasSingleAttachment,
      'str-chat__message--highlighted': highlighted,
      'str-chat__message--is-emoji-only': isOnlyEmojis(message.text),
      'str-chat__message--pinned pinned-message': message.pinned,
      'str-chat__message--with-reactions': hasReactions,
      'str-chat__message-send-can-be-retried':
        message?.status === 'failed' && message?.error?.status !== 403,
      'str-chat__message-with-thread-link': showReplyCountButton || showIsReplyInChannel,
      'str-chat__virtual-message__wrapper--end': endOfGroup,
      'str-chat__virtual-message__wrapper--first': firstOfGroup,
      'str-chat__virtual-message__wrapper--group': groupedByUser,
    },
  );

  const poll = message.poll_id && client.polls.fromState(message.poll_id);

  return (
    <>
      {isBounceDialogOpen && (
        <MessageBounceModal
          MessageBouncePrompt={MessageBouncePrompt}
          onClose={() => setIsBounceDialogOpen(false)}
          open={isBounceDialogOpen}
        />
      )}
      {
        <div className={rootClassName} key={message.id}>
          {PinIndicator && <PinIndicator />}
          {!!reminder && <ReminderNotification reminder={reminder} />}
          {message.user && !isMyMessage() && (
            <Avatar
              className='str-chat__avatar--with-border'
              imageUrl={message.user.image}
              onClick={onUserClick}
              onMouseOver={onUserHover}
              size='lg'
              userName={message.user.name || message.user.id}
            />
          )}
          <div
            className={clsx('str-chat__message-inner', {
              'str-chat__simple-message--error-failed': allowRetry || isBounced,
            })}
            data-testid='message-inner'
            onClick={handleClick}
            onKeyUp={handleClick}
          >
            <MessageActions />
            <div className='str-chat__message-reactions-host'>
              {hasReactions && <ReactionsList reverse />}
            </div>
            <div className='str-chat__message-bubble'>
              {poll && <Poll poll={poll} />}
              {finalAttachments?.length ? (
                <Attachment actionHandler={handleAction} attachments={finalAttachments} />
              ) : null}
              {isAIGenerated ? (
                <StreamedMessageText message={message} renderText={renderText} />
              ) : (
                <MessageText message={message} renderText={renderText} />
              )}
              <MessageErrorIcon />
            </div>
          </div>
          {showReplyCountButton && (
            <MessageRepliesCountButton
              onClick={handleOpenThread}
              reply_count={message.reply_count}
            />
          )}
          {showIsReplyInChannel && <MessageIsThreadReplyInChannelButtonIndicator />}
          {showMetadata && (
            <div className='str-chat__message-metadata'>
              <MessageStatus />
              {!isMyMessage() && !!message.user && (
                <span className='str-chat__message-simple-name'>
                  {message.user.name || message.user.id}
                </span>
              )}
              <MessageTimestamp customClass='str-chat__message-simple-timestamp' />
              {isEdited && (
                <span className='str-chat__mesage-simple-edited'>{t('Edited')}</span>
              )}
              {isEdited && (
                <MessageEditedTimestamp calendar open={isEditedTimestampOpen} />
              )}
            </div>
          )}
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
export const MessageSimple = (props: MessageUIComponentProps) => {
  const messageContext = useMessageContext('MessageSimple');

  return <MemoizedMessageSimple {...messageContext} {...props} />;
};
