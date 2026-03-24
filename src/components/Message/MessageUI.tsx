import React, { useMemo, useState } from 'react';
import clsx from 'clsx';
import { MessageBouncePrompt as DefaultMessageBouncePrompt } from '../MessageBounce';
import { MessageDeletedBubble as DefaultMessageDeletedBubble } from './MessageDeletedBubble';
import { MessageBlocked as DefaultMessageBlocked } from './MessageBlocked';
import { MessageActions as DefaultMessageActions } from '../MessageActions';
import { MessageRepliesCountButton as DefaultMessageRepliesCountButton } from './MessageRepliesCountButton';
import { MessageStatus as DefaultMessageStatus } from './MessageStatus';
import { MessageText } from './MessageText';
import { MessageEditedIndicator as DefaultMessageEditedIndicator } from './MessageEditedIndicator';
import { MessageTimestamp as DefaultMessageTimestamp } from './MessageTimestamp';
import { StreamedMessageText as DefaultStreamedMessageText } from './StreamedMessageText';
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
  isMessageEdited,
  isMessageErrorRetryable,
  messageHasAttachments,
  messageHasGiphyAttachment,
  messageHasReactions,
  messageHasSingleAttachment,
  messageTextHasEmojisOnly,
} from './utils';

import { Avatar as DefaultAvatar } from '../Avatar';
import { Attachment as DefaultAttachment } from '../Attachment';
import { Poll } from '../Poll';
import { MessageReactions as DefaultMessageReactions } from '../Reactions';
import { MessageBounceModal } from '../MessageBounce/MessageBounceModal';
import { useComponentContext } from '../../context/ComponentContext';
import type { MessageContextValue } from '../../context/MessageContext';
import { useMessageContext } from '../../context/MessageContext';

import { useChannelStateContext, useChatContext } from '../../context';

import type { MessageUIComponentProps } from './types';
import { PinIndicator as DefaultPinIndicator } from './PinIndicator';
import { QuotedMessage as DefaultQuotedMessage } from './QuotedMessage';
import { MessageBubble } from './MessageBubble';
import { ErrorBadge } from '../Badge';

type MessageUIWithContextProps = MessageContextValue;

const MessageUIWithContext = ({
  endOfGroup,
  firstOfGroup,
  groupedByUser,
  handleAction,
  handleOpenThread,
  highlighted,
  isMessageAIGenerated,
  isMyMessage,
  message,
  onUserClick,
  onUserHover,
  renderText,
  showAvatar = 'incoming',
  threadList,
}: MessageUIWithContextProps) => {
  const { channel } = useChannelStateContext();
  const { client } = useChatContext();
  const [isBounceDialogOpen, setIsBounceDialogOpen] = useState(false);
  const reminder = useMessageReminder(message.id);

  const {
    Attachment = DefaultAttachment,
    Avatar = DefaultAvatar,
    MessageActions = DefaultMessageActions,
    MessageAlsoSentInChannelIndicator = DefaultMessageAlsoSentInChannelIndicator,
    MessageBlocked = DefaultMessageBlocked,
    MessageBouncePrompt = DefaultMessageBouncePrompt,
    MessageDeleted,
    MessageDeletedBubble = DefaultMessageDeletedBubble,
    MessageEditedIndicator = DefaultMessageEditedIndicator,
    MessageReactions = DefaultMessageReactions,
    MessageRepliesCountButton = DefaultMessageRepliesCountButton,
    MessageStatus = DefaultMessageStatus,
    MessageTimestamp = DefaultMessageTimestamp,
    MessageTranslationIndicator = DefaultMessageTranslationIndicator,
    PinIndicator = DefaultPinIndicator,
    QuotedMessage = DefaultQuotedMessage,
    ReminderNotification = DefaultReminderNotification,
    StreamedMessageText = DefaultStreamedMessageText,
  } = useComponentContext('MessageUI');

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

  if (MessageDeleted && (message.deleted_at || message.type === 'deleted')) {
    return <MessageDeleted message={message} />;
  }

  if (isMessageBlocked(message)) {
    return <MessageBlocked />;
  }

  const poll = message.poll_id && client.polls.fromState(message.poll_id);

  const memberCount = Object.keys(channel?.state?.members ?? {}).length;
  const isDeleted = !!message.deleted_at;
  const hasAttachment = !isDeleted && messageHasAttachments(message);
  const hasSingleAttachment = !isDeleted && messageHasSingleAttachment(message);
  const hasGiphyAttachment = !isDeleted && messageHasGiphyAttachment(message);
  const hasReactions = !isDeleted && messageHasReactions(message);
  const textHasEmojisOnly = !isDeleted && messageTextHasEmojisOnly(message);

  const allowRetry = isMessageErrorRetryable(message);
  const isBounced = isMessageBounced(message);
  const isEdited = isMessageEdited(message) && !isAIGenerated;

  const showMetadata = !groupedByUser || endOfGroup;
  const showReplyCountButton = !threadList && !!message.reply_count;

  const rootClassName = clsx(
    'str-chat__message',
    `str-chat__message--${message.type}`,
    `str-chat__message--${message.status}`,
    {
      'str-chat__message--has-attachment': hasAttachment,
      'str-chat__message--has-giphy-attachment': hasGiphyAttachment,
      'str-chat__message--has-no-text': !message.text,
      'str-chat__message--has-text': !!message.text,
      // eslint-disable-next-line sort-keys
      'str-chat__message--has-single-attachment': hasSingleAttachment,
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

  let handleClick: (() => void) | undefined = undefined;

  if (isBounced) {
    handleClick = () => setIsBounceDialogOpen(true);
  }

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
            className='str-chat__avatar--with-border'
            imageUrl={message.user.image}
            onClick={onUserClick}
            onMouseOver={onUserHover}
            size='md'
            userName={message.user.name || message.user.id}
          />
        )}
        <div
          className={clsx('str-chat__message-inner', {
            'str-chat__message-inner--error': allowRetry || isBounced,
          })}
          data-testid='message-inner'
          onClick={handleClick}
          onKeyUp={handleClick}
        >
          {!isDeleted && <MessageActions />}
          {showReplyCountButton && (
            <MessageRepliesCountButton
              onClick={handleOpenThread}
              reply_count={message.reply_count}
              thread_participants={message.thread_participants}
            />
          )}
          {message.deleted_at ? (
            <MessageDeletedBubble />
          ) : (
            <>
              <MessageBubble>
                {poll && <Poll poll={poll} />}
                {message.quoted_message && <QuotedMessage />}
                {finalAttachments?.length ? (
                  <Attachment
                    actionHandler={handleAction}
                    attachments={finalAttachments}
                  />
                ) : null}
                {isAIGenerated ? (
                  <StreamedMessageText message={message} renderText={renderText} />
                ) : (
                  <MessageText message={message} renderText={renderText} />
                )}
              </MessageBubble>
              <div className='str-chat__message-reactions-host'>
                {hasReactions && <MessageReactions reverse />}
              </div>
              <div className='str-chat__message-error-icon'>
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

/**
 * The default UI component that renders a message and receives functionality and logic from the MessageContext.
 */
export const MessageUI = (props: MessageUIComponentProps) => {
  const messageContext = useMessageContext('MessageUI');

  return <MemoizedMessageUI {...messageContext} {...props} />;
};
