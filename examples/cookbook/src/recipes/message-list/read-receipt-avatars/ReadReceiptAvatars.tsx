import type { PropsWithChildren } from 'react';
import type { MessageReceiptsSnapshot } from 'stream-chat';
import {
  Avatar,
  MessageUI,
  useChannel,
  useChatContext,
  useMessageContext,
  useStateStore,
  WithComponents,
} from 'stream-chat-react';
import './ReadReceiptAvatars.css';

// The tracker groups members by the message their read position is on.
const readersSelector = ({ readersByMessageId }: MessageReceiptsSnapshot) => ({
  readersByMessageId,
});

/** The avatars of the other members whose last read message is this one. */
const ReadReceiptAvatars = () => {
  const channel = useChannel();
  const { client } = useChatContext();
  const { message, threadList } = useMessageContext();
  const { readersByMessageId } = useStateStore(
    channel.messageReceiptsTracker.snapshotStore,
    readersSelector,
  );

  // Read positions belong to the channel's main list, so a thread shows none.
  if (threadList) return null;

  const readers = (readersByMessageId[message.id] ?? []).filter(
    (user) => user.id !== client.userId,
  );
  if (!readers.length) return null;

  return (
    <ul aria-label='Seen by' className='cookbook-read-receipts'>
      {readers.map((user) => (
        <li className='cookbook-read-receipts__reader' key={user.id}>
          <Avatar imageUrl={user.image} size='xs' userName={user.name ?? user.id} />
        </li>
      ))}
    </ul>
  );
};

/** The SDK's message UI, with the reader avatars under it. */
const MessageWithReadReceipts = () => (
  <>
    <MessageUI />
    <ReadReceiptAvatars />
  </>
);

// Declared once, so WithComponents gets the same object on every render.
const overrides = { MessageUI: MessageWithReadReceipts };

export const WithReadReceiptAvatars = ({ children }: PropsWithChildren) => (
  <WithComponents overrides={overrides}>{children}</WithComponents>
);
