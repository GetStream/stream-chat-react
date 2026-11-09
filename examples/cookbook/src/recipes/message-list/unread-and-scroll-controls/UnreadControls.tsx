import type { PropsWithChildren } from 'react';
import type { UnreadSnapshotState } from 'stream-chat';
import {
  IconArrowUp,
  IconXmark,
  useChannel,
  useMessagePaginator,
  useStateStore,
  useThreadContext,
  WithComponents,
} from 'stream-chat-react';
import type {
  UnreadMessagesNotificationProps,
  UnreadMessagesSeparatorProps,
} from 'stream-chat-react';
import './UnreadControls.css';

const newMessagesLabel = (count?: number) =>
  count ? `${count} new message${count === 1 ? '' : 's'}` : 'New messages';

// Marks the channel, or the open thread, read and clears the unread snapshot the separator and the
// banner render from, so both go away at once.
const useMarkRead = () => {
  const channel = useChannel();
  const thread = useThreadContext();
  const messagePaginator = useMessagePaginator();

  return () => {
    const request = thread ? thread.markRead() : channel.markReadViaReporter();
    void request.catch((error) => console.error('Marking read failed', error));
    messagePaginator.clearUnreadSnapshot();
  };
};

const UnreadSeparator = ({ unreadCount }: UnreadMessagesSeparatorProps) => {
  const markRead = useMarkRead();

  // The root keeps the SDK's class: the list watches that element to show the banner while the
  // separator is out of view.
  return (
    <div className='str-chat__unread-messages-separator cookbook-unread-separator'>
      <span className='cookbook-unread-separator__label'>
        {newMessagesLabel(unreadCount)}
      </span>
      <button
        className='cookbook-unread-separator__mark-read'
        onClick={markRead}
        type='button'
      >
        Mark as read
      </button>
    </div>
  );
};

const unreadCountSelector = ({ unreadCount }: UnreadSnapshotState) => ({ unreadCount });

const JumpToUnreadBanner = ({ queryMessageLimit }: UnreadMessagesNotificationProps) => {
  const messagePaginator = useMessagePaginator();
  const { unreadCount } = useStateStore(
    messagePaginator.unreadStateSnapshot,
    unreadCountSelector,
  );
  const markRead = useMarkRead();

  const jumpToFirstUnread = () =>
    void messagePaginator.jumpToTheFirstUnreadMessage({ pageSize: queryMessageLimit });

  return (
    <div className='cookbook-unread-banner'>
      <button
        className='cookbook-unread-banner__jump'
        onClick={jumpToFirstUnread}
        type='button'
      >
        <IconArrowUp />
        {newMessagesLabel(unreadCount)}
      </button>
      <button
        aria-label='Mark as read'
        className='cookbook-unread-banner__dismiss'
        onClick={markRead}
        type='button'
      >
        <IconXmark />
      </button>
    </div>
  );
};

// Declared once, so WithComponents gets the same object on every render.
const overrides = {
  UnreadMessagesNotification: JumpToUnreadBanner,
  UnreadMessagesSeparator: UnreadSeparator,
};

export const WithUnreadControls = ({ children }: PropsWithChildren) => (
  <WithComponents overrides={overrides}>{children}</WithComponents>
);
