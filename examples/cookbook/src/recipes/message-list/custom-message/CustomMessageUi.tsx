import type { LocalMessage, UserResponse } from 'stream-chat';
import { convertTimestampToDate } from 'stream-chat';
import {
  Avatar,
  isMessageDeleted,
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
  const { deliveredTo = [], isMyMessage, message, readBy = [] } = useMessageContext();
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
          </>
        )}
      </div>
    </div>
  );
};
