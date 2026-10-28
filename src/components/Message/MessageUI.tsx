import React, { useState } from 'react';
import clsx from 'clsx';
import { MessageBouncePrompt as DefaultMessageBouncePrompt } from '../MessageBounce';
import { MessageDeletedBubble as DefaultMessageDeletedBubble } from './MessageDeletedBubble';
import { MessageBlocked as DefaultMessageBlocked } from './MessageBlocked';
import { MessageActions as DefaultMessageActions } from '../MessageActions';
import { MessageRepliesCountButton as DefaultMessageRepliesCountButton } from './MessageRepliesCountButton';
import { MessageStatus as DefaultMessageStatus } from './MessageStatus';
import { MessageEditedIndicator as DefaultMessageEditedIndicator } from './MessageEditedIndicator';
import { MessageTimestamp as DefaultMessageTimestamp } from './MessageTimestamp';
import { isDateSeparatorMessage } from '../MessageList';
import { MessageAlsoSentInChannelIndicator as DefaultMessageAlsoSentInChannelIndicator } from './MessageAlsoSentInChannelIndicator';
import { ReminderNotification as DefaultReminderNotification } from './ReminderNotification';
import { MessageTranslationIndicator as DefaultMessageTranslationIndicator } from './MessageTranslationIndicator';
import { useMessageReminder } from './hooks';
import {
  areMessageUIPropsEqual,
  countEmojis,
  isMessageBlocked,
  isMessageBounced,
  isMessageDeleted,
  isMessageEdited,
  isMessageErrorRetryable,
  messageHasAttachments,
  messageHasGiphyAttachment,
  messageHasQuotedMessage,
  messageHasReactions,
  messageHasSingleAttachment,
  messageTextHasEmojisOnly,
} from './utils';

import { Avatar as DefaultAvatar } from '../Avatar';
import { MessageReactions as DefaultMessageReactions } from '../Reactions';
import { MessageBounceModal } from '../MessageBounce/MessageBounceModal';
import { useComponentContext } from '../../context/ComponentContext';
import type { MessageContextValue } from '../../context/MessageContext';
import { MessageProvider, useMessageContext } from '../../context/MessageContext';

import { useChannel, useTranslationContext } from '../../context';
import { useThreadContext } from '../Threads';

import type { MessageUIComponentProps } from './types';
import { PinIndicator as DefaultPinIndicator } from './PinIndicator';
import { MessageBubble } from './MessageBubble';
import { MessageBubbleContent as DefaultMessageBubbleContent } from './MessageBubbleContent';
import { ErrorBadge } from '../Badge';
import { extractDisplayInfo as defaultExtractDisplayInfo } from '../Avatar/utils';

type MessageUIWithContextProps = MessageContextValue;

const MessageUIWithContext = (props: MessageUIWithContextProps) => {
  const {
    endOfGroup,
    firstOfGroup,
    groupedByUser,
    highlighted,
    isMessageAIGenerated,
    isMyMessage,
    message,
    onUserClick,
    onUserHover,
    showAvatar = 'incoming',
  } = props;
  const channel = useChannel();
  const threadInstance = useThreadContext();
  const { t } = useTranslationContext();
  const [isBounceDialogOpen, setIsBounceDialogOpen] = useState(false);
  const reminder = useMessageReminder(message.id);

  const {
    Avatar = DefaultAvatar,
    extractDisplayInfo = defaultExtractDisplayInfo,
    MessageActions = DefaultMessageActions,
    MessageAlsoSentInChannelIndicator = DefaultMessageAlsoSentInChannelIndicator,
    MessageBlocked = DefaultMessageBlocked,
    MessageBouncePrompt = DefaultMessageBouncePrompt,
    MessageBubbleContent = DefaultMessageBubbleContent,
    MessageDeleted,
    MessageDeletedBubble = DefaultMessageDeletedBubble,
    MessageEditedIndicator = DefaultMessageEditedIndicator,
    MessageReactions = DefaultMessageReactions,
    MessageRepliesCountButton = DefaultMessageRepliesCountButton,
    MessageStatus = DefaultMessageStatus,
    MessageTimestamp = DefaultMessageTimestamp,
    MessageTranslationIndicator = DefaultMessageTranslationIndicator,
    PinIndicator = DefaultPinIndicator,
    ReminderNotification = DefaultReminderNotification,
  } = useComponentContext();

  const isAIGenerated = isMessageAIGenerated?.(message);
  const isDeleted = isMessageDeleted(message);

  if (isDateSeparatorMessage(message)) {
    return null;
  }

  if (MessageDeleted && isDeleted) {
    return <MessageDeleted message={message} />;
  }

  if (isMessageBlocked(message)) {
    return <MessageBlocked />;
  }

  const memberCount = Object.keys(channel?.state?.members ?? {}).length;
  const hasAttachment = !isDeleted && messageHasAttachments(message);
  const hasPoll = !isDeleted && !!message.poll_id;
  // A poll shares the bubble, so an attachment next to it is not laid out as the only content.
  const hasSingleAttachment =
    !isDeleted && !hasPoll && messageHasSingleAttachment(message);
  const hasGiphyAttachment = !isDeleted && messageHasGiphyAttachment(message);
  const hasReactions = !isDeleted && messageHasReactions(message);
  const hasQuotedMessage = !isDeleted && messageHasQuotedMessage(message);
  const textHasEmojisOnly = !isDeleted && messageTextHasEmojisOnly(message);

  const allowRetry = isMessageErrorRetryable(message);
  const isBounced = isMessageBounced(message);
  const isEdited = isMessageEdited(message) && !isAIGenerated;

  const showMetadata = !groupedByUser || endOfGroup;
  const showReplyCountButton = !threadInstance && !!message.reply_count;

  const rootClassName = clsx(
    'str-chat__message',
    `str-chat__message--${message.type}`,
    `str-chat__message--${message.status}`,
    {
      'str-chat__message--has-attachment': hasAttachment,
      'str-chat__message--has-giphy-attachment': hasGiphyAttachment,
      'str-chat__message--has-no-text': !message.text,
      'str-chat__message--has-poll': hasPoll,
      'str-chat__message--has-quoted-message': hasQuotedMessage,
      'str-chat__message--has-single-attachment': hasSingleAttachment,
      'str-chat__message--has-text': !!message.text,
      'str-chat__message--highlighted': highlighted,
      'str-chat__message--is-emoji-only': textHasEmojisOnly,
      [`str-chat__message--is-emoji-only-count-${countEmojis(message.text)}`]:
        textHasEmojisOnly,
      'str-chat__message--me': isMyMessage(),
      'str-chat__message--other': !isMyMessage(),
      'str-chat__message--pinned': message.pinned,
      'str-chat__message--with-avatar': (() => {
        if (!message.user) return false;
        if (showAvatar === 'incoming') return !isMyMessage();
        if (showAvatar === 'outgoing') return isMyMessage();
        return showAvatar;
      })(),
      'str-chat__message--with-reactions': hasReactions,
      'str-chat__message-send-can-be-retried':
        message?.status === 'failed' && message?.error?.status !== 403,
      'str-chat__message-with-thread-link': showReplyCountButton,
      'str-chat__virtual-message__wrapper--end': endOfGroup,
      'str-chat__virtual-message__wrapper--first': firstOfGroup,
      'str-chat__virtual-message__wrapper--group': groupedByUser,
    },
  );

  let handleClick: (() => void) | undefined;

  if (isBounced) {
    handleClick = () => setIsBounceDialogOpen(true);
  }

  const isMessageInnerInteractive = !!handleClick;
  const messageInnerAriaLabel = isMessageInnerInteractive
    ? t('message.ui.reviewBouncedMessage.ariaLabel', 'Review bounced message')
    : undefined;

  const handleMessageInnerKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (!handleClick || (event.key !== 'Enter' && event.key !== ' ')) return;

    event.preventDefault();
    handleClick();
  };

  return (
    <>
      {isBounceDialogOpen && (
        <MessageBounceModal
          MessageBouncePrompt={MessageBouncePrompt}
          onClose={() => setIsBounceDialogOpen(false)}
          open={isBounceDialogOpen}
        />
      )}
      <div className={rootClassName} key={message.id}>
        {message.pinned && <PinIndicator message={message} />}
        {message.show_in_channel && <MessageAlsoSentInChannelIndicator />}
        {!!reminder && <ReminderNotification reminder={reminder} />}
        <MessageTranslationIndicator message={message} />
        {message.user && (
          <Avatar
            {...extractDisplayInfo({ user: message.user ?? undefined })}
            className='str-chat__avatar--with-border'
            onClick={onUserClick}
            onMouseOver={onUserHover}
            size='md'
          />
        )}
        <div
          aria-label={messageInnerAriaLabel}
          className={clsx('str-chat__message-inner', {
            'str-chat__message-inner--error': allowRetry || isBounced,
          })}
          data-testid='message-inner'
          onClick={handleClick}
          onKeyDown={isMessageInnerInteractive ? handleMessageInnerKeyDown : undefined}
          role={isMessageInnerInteractive ? 'button' : undefined}
          tabIndex={isMessageInnerInteractive ? 0 : undefined}
        >
          {!isDeleted && <MessageActions />}
          {showReplyCountButton && (
            <MessageRepliesCountButton
              reply_count={message.reply_count}
              thread_participants={message.thread_participants}
            />
          )}
          {isDeleted ? (
            <MessageDeletedBubble />
          ) : (
            <>
              <MessageBubble>
                {/* The bubble content reads `MessageContext`; this hands it the props passed to
                    `MessageUI`, which override the context's values. */}
                <MessageProvider value={props}>
                  <MessageBubbleContent />
                </MessageProvider>
              </MessageBubble>
              <div className='str-chat__message-reactions-host'>
                {hasReactions && <MessageReactions reverse />}
              </div>
              <div className='str-chat__message-error-indicator'>
                <ErrorBadge />
              </div>
            </>
          )}
        </div>
        {showMetadata && (
          <div className='str-chat__message-metadata'>
            <MessageStatus />
            {!isMyMessage() && !!message.user && memberCount > 2 && (
              <span className='str-chat__message-metadata__name'>
                {message.user.name || message.user.id}
              </span>
            )}
            <MessageTimestamp customClass='str-chat__message-metadata__timestamp' />
            {!isDeleted && isEdited && <MessageEditedIndicator />}
          </div>
        )}
      </div>
    </>
  );
};

const MemoizedMessageUI = React.memo(
  MessageUIWithContext,
  areMessageUIPropsEqual,
) as typeof MessageUIWithContext;

/** Default message UI; reads its data and handlers from `MessageContext`. */
export const MessageUI = (props: MessageUIComponentProps) => {
  const messageContext = useMessageContext();

  return <MemoizedMessageUI {...messageContext} {...props} />;
};
