import { useMemo } from 'react';
import type { LocalMessage, UserResponse } from 'stream-chat';
import {
  Avatar,
  MessageText,
  ReactionsList,
  useMessageContext,
  useChatContext,
  useComponentContext,
} from 'stream-chat-react';

// ─── Shared Helpers ────────────────────────────────────────────────

const statusIconMap = {
  delivered: '✅',
  read: '👁️',
  sent: '✉️',
  sending: '🛫',
  unknown: '❓',
};

type MessageStatusParams = {
  message: LocalMessage;
  ownUserId: string;
  deliveredTo: UserResponse[];
  readBy: UserResponse[];
  threadList: boolean;
};

const getMessageStatus = ({
  message,
  ownUserId,
  deliveredTo,
  readBy,
  threadList,
}: MessageStatusParams): keyof typeof statusIconMap => {
  const [firstReader] = readBy;
  const [firstDeliveredUser] = deliveredTo;

  const justReadByMe = readBy?.length === 1 && firstReader?.id === ownUserId;
  const read = !!(readBy?.length && !justReadByMe && !threadList);

  const deliveredOnlyToMe =
    deliveredTo?.length === 1 && firstDeliveredUser?.id === ownUserId;
  const delivered = !!(deliveredTo?.length && !deliveredOnlyToMe && !read && !threadList);

  const sent = message.status === 'received' && !delivered && !read && !threadList;
  const sending = message.status === 'sending';

  if (read) return 'read';
  if (delivered) return 'delivered';
  if (sent) return 'sent';
  if (sending) return 'sending';
  return 'unknown';
};

// ─── Variant 0: Raw text ──────────────────────────────────────────

export const CustomMessageUi_V0 = () => {
  const { message } = useMessageContext();

  return <div data-message-id={message.id}>{message.text}</div>;
};

// ─── Variant 1: Sender names + alignment ──────────────────────────

export const CustomMessageUi_V1 = () => {
  const { isMyMessage, message } = useMessageContext();

  const messageUiClassNames = ['custom-message-ui'];

  if (isMyMessage()) {
    messageUiClassNames.push('custom-message-ui--mine');
  } else {
    messageUiClassNames.push('custom-message-ui--other');
  }

  return (
    <div className={messageUiClassNames.join(' ')} data-message-id={message.id}>
      <strong className='custom-message-ui__name'>
        {message.user?.name || message.user?.id}
      </strong>
      <span>{message.text}</span>
    </div>
  );
};

// ─── Variant 2: Avatars ──────────────────────────────────────────

export const CustomMessageUi_V2 = () => {
  const { isMyMessage, message } = useMessageContext();

  const messageUiClassNames = ['custom-message-ui'];

  if (isMyMessage()) {
    messageUiClassNames.push('custom-message-ui--mine');
  } else {
    messageUiClassNames.push('custom-message-ui--other');
  }

  return (
    <div className={messageUiClassNames.join(' ')} data-message-id={message.id}>
      <Avatar
        imageUrl={message.user?.image}
        size='sm'
        userName={message.user?.name || message.user?.id}
      />
      <span className='custom-message-ui__text'>{message.text}</span>
    </div>
  );
};

// ─── Variant 3a: Avatars with plain text (no markdown) ────────────
// Same as V2 - shows the problem of plain text not rendering markdown

export const CustomMessageUi_V3a = CustomMessageUi_V2;

// ─── Variant 3b: Avatars with MessageText (rich text) ─────────────

export const CustomMessageUi_V3b = () => {
  const { isMyMessage, message } = useMessageContext();

  const messageUiClassNames = ['custom-message-ui'];

  if (isMyMessage()) {
    messageUiClassNames.push('custom-message-ui--mine');
  } else {
    messageUiClassNames.push('custom-message-ui--other');
  }

  return (
    <div className={messageUiClassNames.join(' ')} data-message-id={message.id}>
      <Avatar
        imageUrl={message.user?.image}
        size='sm'
        userName={message.user?.name || message.user?.id}
      />
      <MessageText />
    </div>
  );
};

// ─── Metadata Component ───────────────────────────────────────────

const CustomMessageUiMetadata = ({
  showReplyCount = false,
}: {
  showReplyCount?: boolean;
}) => {
  const {
    deliveredTo = [],
    handleOpenThread,
    message,
    readBy = [],
    threadList,
  } = useMessageContext();
  const { client } = useChatContext();
  const {
    created_at: createdAt,
    message_text_updated_at: messageTextUpdatedAt,
    reply_count: replyCount = 0,
  } = message;

  const status = useMemo(
    () =>
      getMessageStatus({
        message,
        ownUserId: client.user?.id ?? '',
        deliveredTo,
        readBy,
        threadList,
      }),
    [message, client, deliveredTo, readBy, threadList],
  );

  return (
    <div className='custom-message-ui__metadata'>
      <div className='custom-message-ui__metadata-created-at'>
        {createdAt?.toLocaleString()}
      </div>
      <div className='custom-message-ui__metadata-read-status'>
        {statusIconMap[status]}
      </div>
      {messageTextUpdatedAt && (
        <div
          className='custom-message-ui__metadata-edited-status'
          title={messageTextUpdatedAt}
        >
          Edited
        </div>
      )}
      {showReplyCount && replyCount > 0 && (
        <button
          className='custom-message-ui__metadata-reply-count'
          onClick={handleOpenThread}
        >
          <span>
            {replyCount} {replyCount > 1 ? 'replies' : 'reply'}
          </span>
        </button>
      )}
    </div>
  );
};

// ─── Variant 4: With metadata ─────────────────────────────────────

export const CustomMessageUi_V4 = () => {
  const { isMyMessage, message } = useMessageContext();

  const messageUiClassNames = ['custom-message-ui'];

  if (isMyMessage()) {
    messageUiClassNames.push('custom-message-ui--mine');
  } else {
    messageUiClassNames.push('custom-message-ui--other');
  }

  return (
    <div className={messageUiClassNames.join(' ')} data-message-id={message.id}>
      <div className='custom-message-ui__body'>
        <Avatar
          imageUrl={message.user?.image}
          size='sm'
          userName={message.user?.name || message.user?.id}
        />
        <MessageText />
      </div>
      <CustomMessageUiMetadata />
    </div>
  );
};

// ─── Variant 5: With grouped metadata ─────────────────────────────
// Same component as V4, the grouping is done via CSS (str-chat__li--bottom / str-chat__li--single)

export const CustomMessageUi_V5 = CustomMessageUi_V4;

// ─── Actions Component ────────────────────────────────────────────

const CustomMessageUiActions = ({
  showReactions = false,
}: {
  showReactions?: boolean;
}) => {
  const {
    handleDelete,
    handleFlag,
    handleOpenThread,
    handlePin,
    handleReaction,
    message,
    threadList,
  } = useMessageContext();

  const { reactionOptions = [] } = useComponentContext();

  if (threadList) return null;

  return (
    <div className='custom-message-ui__actions'>
      <div className='custom-message-ui__actions-group'>
        <button onClick={handlePin} title={message.pinned ? 'Unpin' : 'Pin'}>
          {message.pinned ? '📍' : '📌'}
        </button>
        <button onClick={handleDelete} title='Delete'>
          🗑️
        </button>
        <button onClick={handleOpenThread} title='Open thread'>
          ↩️
        </button>
        <button onClick={handleFlag} title='Flag message'>
          🚩
        </button>
      </div>
      {showReactions && (
        <div className='custom-message-ui__actions-group'>
          {reactionOptions.map(({ Component, name, type }) => (
            <button
              key={type}
              onClick={(e) => handleReaction(type, e)}
              title={`React with: ${name}`}
            >
              <Component />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Variant 6: With message actions ──────────────────────────────

export const CustomMessageUi_V6 = () => {
  const { isMyMessage, message } = useMessageContext();

  const messageUiClassNames = ['custom-message-ui'];

  if (isMyMessage()) {
    messageUiClassNames.push('custom-message-ui--mine');
  } else {
    messageUiClassNames.push('custom-message-ui--other');
  }

  return (
    <div className={messageUiClassNames.join(' ')} data-message-id={message.id}>
      <div className='custom-message-ui__body'>
        <Avatar
          imageUrl={message.user?.image}
          size='sm'
          userName={message.user?.name || message.user?.id}
        />
        <MessageText />
      </div>
      <CustomMessageUiMetadata />
      <CustomMessageUiActions />
    </div>
  );
};

// ─── Variant 7: With deleted message ──────────────────────────────

export const CustomMessageUi_V7 = () => {
  const { isMyMessage, message } = useMessageContext();

  const messageUiClassNames = ['custom-message-ui'];

  if (isMyMessage()) {
    messageUiClassNames.push('custom-message-ui--mine');
  } else {
    messageUiClassNames.push('custom-message-ui--other');
  }

  return (
    <div className={messageUiClassNames.join(' ')} data-message-id={message.id}>
      {message.deleted_at && (
        <div className='custom-message-ui__body'>This message has been deleted...</div>
      )}
      {!message.deleted_at && (
        <>
          <div className='custom-message-ui__body'>
            <Avatar
              imageUrl={message.user?.image}
              size='sm'
              userName={message.user?.name || message.user?.id}
            />
            <MessageText />
          </div>
          <CustomMessageUiMetadata showReplyCount />
          <CustomMessageUiActions />
        </>
      )}
    </div>
  );
};

// ─── Variant 8: Complete with reactions ───────────────────────────

export const CustomMessageUi_V8 = () => {
  const { isMyMessage, message } = useMessageContext();

  const messageUiClassNames = ['custom-message-ui'];

  if (isMyMessage()) {
    messageUiClassNames.push('custom-message-ui--mine');
  } else {
    messageUiClassNames.push('custom-message-ui--other');
  }

  return (
    <div className={messageUiClassNames.join(' ')} data-message-id={message.id}>
      {message.deleted_at && (
        <div className='custom-message-ui__body'>This message has been deleted...</div>
      )}
      {!message.deleted_at && (
        <>
          <div className='custom-message-ui__body'>
            <Avatar
              imageUrl={message.user?.image}
              size='sm'
              userName={message.user?.name || message.user?.id}
            />
            <MessageText />
          </div>
          <CustomMessageUiMetadata showReplyCount />
          <CustomMessageUiActions showReactions />
          <ReactionsList />
        </>
      )}
    </div>
  );
};

// ─── Variant Map ──────────────────────────────────────────────────

export const variantMap: Record<string, React.ComponentType> = {
  '0': CustomMessageUi_V0,
  '1': CustomMessageUi_V1,
  '2': CustomMessageUi_V2,
  '3a': CustomMessageUi_V3a,
  '3b': CustomMessageUi_V3b,
  '4': CustomMessageUi_V4,
  '5': CustomMessageUi_V5,
  '6': CustomMessageUi_V6,
  '7': CustomMessageUi_V7,
  '8': CustomMessageUi_V8,
};
