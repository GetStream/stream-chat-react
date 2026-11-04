import type { LocalMessage, UserResponse } from 'stream-chat';
import { convertTimestampToDate } from 'stream-chat';
import {
  Avatar,
  MessageText,
  useChatContext,
  useMessageContext,
  useThreadContext,
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
  isInThread: boolean;
};

const getMessageStatus = ({
  deliveredTo,
  message,
  ownUserId,
  readBy,
  isInThread,
}: MessageStatusParams): keyof typeof statusIconMap => {
  const [firstReader] = readBy;
  const [firstDeliveredUser] = deliveredTo;

  const justReadByMe = readBy.length === 1 && firstReader?.id === ownUserId;
  const read = readBy.length > 0 && !justReadByMe && !isInThread;

  const deliveredOnlyToMe =
    deliveredTo.length === 1 && firstDeliveredUser?.id === ownUserId;
  const delivered = deliveredTo.length > 0 && !deliveredOnlyToMe && !read && !isInThread;

  const sent = message.status === 'received' && !delivered && !read && !isInThread;
  const sending = message.status === 'sending';

  if (read) return 'read';
  if (delivered) return 'delivered';
  if (sent) return 'sent';
  if (sending) return 'sending';
  return 'unknown';
};

const CustomMessageUiMetadata = () => {
  const { deliveredTo = [], isMyMessage, message, readBy = [] } = useMessageContext();
  const { client } = useChatContext();
  // Read and delivery cursors sit on channel messages, so a thread list's `readBy` / `deliveredTo`
  // say nothing about its replies, and the parent gets none. As in the SDK's `MessageStatus`, a
  // message shown in a thread is never read, delivered or sent here.
  const isInThread = !!useThreadContext();

  const createdAt = convertTimestampToDate(message.created_at);
  const editedAt = convertTimestampToDate(message.message_text_updated_at);
  const status =
    statusIconMap[
      getMessageStatus({
        deliveredTo,
        message,
        ownUserId: client.user?.id ?? '',
        readBy,
        isInThread,
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
    </div>
  );
};

export const CustomMessageUi = () => {
  const { isMyMessage, message } = useMessageContext();

  const messageUiClassNames = ['cookbook-message-ui'];

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
        <div className='cookbook-message-ui__text'>
          <MessageText />
        </div>
        <CustomMessageUiMetadata />
      </div>
    </div>
  );
};
