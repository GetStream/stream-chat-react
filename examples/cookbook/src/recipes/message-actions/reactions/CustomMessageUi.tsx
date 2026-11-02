import type { LocalMessage, UserResponse } from 'stream-chat';
import { convertTimestampToDate } from 'stream-chat';
import {
  Avatar,
  isMessageDeleted,
  MessageReactions,
  MessageText,
  useChatContext,
  useComponentContext,
  useMessageContext,
  useThreadContext,
  useUserRole,
} from 'stream-chat-react';
import './CustomMessageUi.css';

const statusIconMap = {
  delivered: { icon: '✅', label: 'Delivered' },
  read: { icon: '👁️', label: 'Read' },
  sending: { icon: '🛫', label: 'Sending' },
  sent: { icon: '✉️', label: 'Sent' },
  unknown: { icon: '❓', label: 'Status unknown' },
};

type MessageStatusParams = {
  deliveredTo: UserResponse[];
  message: LocalMessage;
  ownUserId: string;
  readBy: UserResponse[];
  threadList: boolean;
};

const getMessageStatus = ({
  deliveredTo,
  message,
  ownUserId,
  readBy,
  threadList,
}: MessageStatusParams): keyof typeof statusIconMap => {
  const [firstReader] = readBy;
  const [firstDeliveredUser] = deliveredTo;

  const justReadByMe = readBy.length === 1 && firstReader?.id === ownUserId;
  const read = readBy.length > 0 && !justReadByMe && !threadList;

  const deliveredOnlyToMe =
    deliveredTo.length === 1 && firstDeliveredUser?.id === ownUserId;
  const delivered = deliveredTo.length > 0 && !deliveredOnlyToMe && !read && !threadList;

  const sent = message.status === 'received' && !delivered && !read && !threadList;
  const sending = message.status === 'sending';

  if (read) return 'read';
  if (delivered) return 'delivered';
  if (sent) return 'sent';
  if (sending) return 'sending';
  return 'unknown';
};

const CustomMessageUiMetadata = () => {
  const {
    deliveredTo = [],
    handleOpenThread,
    isMyMessage,
    message,
    readBy = [],
  } = useMessageContext();
  const { client } = useChatContext();
  const threadList = !!useThreadContext();

  const createdAt = convertTimestampToDate(message.created_at);
  const editedAt = convertTimestampToDate(message.message_text_updated_at);
  const status =
    statusIconMap[
      getMessageStatus({
        deliveredTo,
        message,
        ownUserId: client.user?.id ?? '',
        readBy,
        threadList,
      })
    ];

  return (
    <div className='cookbook-message-ui__metadata'>
      <span>
        {createdAt?.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
      </span>
      {isMyMessage() && (
        <span aria-label={status.label} role='img' title={status.label}>
          {status.icon}
        </span>
      )}
      {editedAt && <span title={editedAt.toLocaleString()}>Edited</span>}
      {!threadList && message.reply_count > 0 && (
        <span>
          <button
            className='cookbook-message-ui__reply-count'
            onClick={handleOpenThread}
            type='button'
          >
            {message.reply_count} {message.reply_count > 1 ? 'replies' : 'reply'}
          </button>
        </span>
      )}
    </div>
  );
};

const CustomMessageUiActions = () => {
  const {
    handleDelete,
    handleFlag,
    handleOpenThread,
    handlePin,
    handleReaction,
    message,
  } = useMessageContext();
  const threadList = !!useThreadContext();
  const { canDelete, canFlag, canPin, canReact, canReply } = useUserRole(message);
  const { reactionOptions } = useComponentContext();
  const quickReactions =
    reactionOptions && 'quick' in reactionOptions ? reactionOptions.quick : {};
  // The reactions the user has given show as pressed; pressing one again removes it.
  const ownReactionTypes = new Set(message.own_reactions?.map(({ type }) => type));

  return (
    <div className='cookbook-message-ui__actions'>
      <div className='cookbook-message-ui__actions-group'>
        {canPin && !threadList && (
          <button
            aria-label={message.pinned ? 'Unpin' : 'Pin'}
            onClick={handlePin}
            title={message.pinned ? 'Unpin' : 'Pin'}
            type='button'
          >
            <span aria-hidden='true'>{message.pinned ? '📍' : '📌'}</span>
          </button>
        )}
        {canDelete && (
          <button
            aria-label='Delete'
            onClick={() => void handleDelete()}
            title='Delete'
            type='button'
          >
            <span aria-hidden='true'>🗑️</span>
          </button>
        )}
        {canReply && !threadList && (
          <button
            aria-label='Open thread'
            onClick={handleOpenThread}
            title='Open thread'
            type='button'
          >
            <span aria-hidden='true'>↩️</span>
          </button>
        )}
        {canFlag && (
          <button
            aria-label='Flag message'
            onClick={handleFlag}
            title='Flag message'
            type='button'
          >
            <span aria-hidden='true'>🚩</span>
          </button>
        )}
      </div>
      {canReact && (
        <div className='cookbook-message-ui__actions-group'>
          {Object.entries(quickReactions).map(([type, { Component, name }]) => (
            <button
              aria-label={`React with ${name}`}
              aria-pressed={ownReactionTypes.has(type)}
              key={type}
              onClick={(event) => void handleReaction(type, event)}
              title={`React with ${name}`}
              type='button'
            >
              <span aria-hidden='true'>
                <Component />
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const CustomMessageUi = () => {
  const { isMyMessage, message } = useMessageContext();

  const messageUiClassNames = ['cookbook-message-ui'];
  const isDeleted = isMessageDeleted(message);

  if (isMyMessage()) {
    messageUiClassNames.push('cookbook-message-ui--mine');
  } else {
    messageUiClassNames.push('cookbook-message-ui--other');
  }

  return (
    <div className={messageUiClassNames.join(' ')}>
      <Avatar
        className='cookbook-message-ui__avatar'
        imageUrl={message.user?.image}
        size='md'
        userName={message.user?.name || message.user?.id}
      />
      <div className='cookbook-message-ui__content'>
        {isDeleted ? (
          <div className='cookbook-message-ui__deleted'>This message was deleted.</div>
        ) : (
          <>
            <div className='cookbook-message-ui__text'>
              <MessageText />
            </div>
            <CustomMessageUiMetadata />
            <MessageReactions />
          </>
        )}
      </div>
      {!isDeleted && <CustomMessageUiActions />}
    </div>
  );
};
