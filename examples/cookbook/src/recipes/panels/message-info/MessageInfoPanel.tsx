import { useEffect, useId } from 'react';
import type {
  Channel,
  ChannelStateData,
  LocalMessage,
  MessageReceiptsSnapshot,
  PaginatorState,
  UserResponse,
} from 'stream-chat';
import { convertTimestampToDate } from 'stream-chat';
import { Avatar, useChatContext, useStateStore } from 'stream-chat-react';
import { useSlotChannel } from 'stream-chat-react/slot-layout';
import { useSidePanel } from '../../../base/SidePanel';
import './MessageInfoPanel.css';

const revisionSelector = ({ revision }: MessageReceiptsSnapshot) => ({ revision });
const readSelector = ({ read }: ChannelStateData) => ({ read });
const itemsSelector = ({ items }: PaginatorState<LocalMessage>) => ({ items });

// Day and 24-hour time, like the message list's timestamps. The panel's own text is English, so
// its dates are too. An app in another language passes its language here.
const timeFormat = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  hour: '2-digit',
  hourCycle: 'h23',
  minute: '2-digit',
  month: 'short',
});

type Receipt = { at?: Date; user: UserResponse };

const ReceiptList = ({ receipts, title }: { receipts: Receipt[]; title: string }) => {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId} className='cookbook-message-info__section'>
      <h3 className='cookbook-side-panel__section-title' id={headingId}>
        {title}
      </h3>
      {receipts.length ? (
        <ul className='cookbook-message-info__list'>
          {receipts.map(({ at, user }) => (
            <li className='cookbook-message-info__row' key={user.id}>
              <Avatar imageUrl={user.image} size='md' userName={user.name ?? user.id} />
              <span className='cookbook-message-info__name'>{user.name ?? user.id}</span>
              {at && (
                <time className='cookbook-message-info__time' dateTime={at.toISOString()}>
                  {timeFormat.format(at)}
                </time>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className='cookbook-message-info__empty'>Nobody yet</p>
      )}
    </section>
  );
};

type ReceiptsProps = { channel: Channel; messageId: string };

/** The message and its receipts, read from the channel, so an edit or a new receipt shows. */
const Receipts = ({ channel, messageId }: ReceiptsProps) => {
  const { client } = useChatContext();
  const tracker = channel.messageReceiptsTracker;
  // Re-renders whenever the channel's messages change, so an edited text shows.
  useStateStore(channel.messagePaginator.state, itemsSelector);
  // Re-renders whenever someone's read or delivered position moves.
  useStateStore(tracker.snapshotStore, revisionSelector);
  // The times come from each member's read state.
  const { read } = useStateStore(channel.state, readSelector);

  const message = channel.messagePaginator.getItem(messageId);
  if (!message) return null;

  const ref = { msgId: message.id, timestamp: message.created_at };
  const isOther = (user: UserResponse) => user.id !== client.userId;

  const readBy = tracker
    .readersForMessage(ref)
    .filter(isOther)
    .map((user) => ({ at: convertTimestampToDate(read[user.id]?.last_read), user }));
  const deliveredTo = tracker
    .deliveredNotReadForMessage(ref)
    .filter(isOther)
    .map((user) => ({
      at: convertTimestampToDate(read[user.id]?.last_delivered_at),
      user,
    }));

  return (
    <div className='cookbook-message-info'>
      <p className='cookbook-message-info__message'>{message.text}</p>
      <ReceiptList receipts={readBy} title='Read by' />
      <ReceiptList receipts={deliveredTo} title='Delivered to' />
    </div>
  );
};

type MessageInfoProps = {
  /** The channel the message belongs to. */
  cid: string;
  messageId: string;
};

/**
 * The side panel's body for a message's receipts. It shows while the message's channel is open in
 * the `channel` slot, and closes the side panel when the user opens another channel.
 */
export const MessageInfo = ({ cid, messageId }: MessageInfoProps) => {
  const channel = useSlotChannel({ slot: 'channel' });
  const { closeSidePanel } = useSidePanel();
  const isMessageChannelOpen = channel?.cid === cid;

  useEffect(() => {
    if (!isMessageChannelOpen) closeSidePanel();
  }, [closeSidePanel, isMessageChannelOpen]);

  if (!channel || !isMessageChannelOpen) return null;
  return <Receipts channel={channel} messageId={messageId} />;
};
