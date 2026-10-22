import React, { useCallback, useEffect, useState } from 'react';

import {
  useChannel,
  useChatContext,
  useComponentContextIcons,
  useTranslationContext,
} from '../../context';
import { useThreadContext } from '../Threads/ThreadContext';
import { useStateStore } from '../../store';

import type { ChannelStateData, EventPayload, Thread, ThreadState } from 'stream-chat';
import { Badge } from '../Badge';
import { Button } from '../Button';

export type ScrollToLatestMessageButtonProps = {
  /** Whether newer messages than the loaded set exist. The button then shows even at the bottom. */
  isNotAtLatestMessageSet?: boolean;
  isMessageListScrolledToBottom?: boolean;
  onClick: React.MouseEventHandler;
};

const threadStateSelector = ({ parentMessage }: ThreadState) => ({
  parentMessage,
});

/**
 * The current user's unread count in the channel, as the channel's read state holds it. The read
 * state is the one place every source of unread messages lands - live arrivals, the count a
 * (re)query returns, a mark-unread, a read from any device - so the number covers messages that
 * never arrived as an event, and drops to 0 once the channel is marked read.
 * Always 0 in a thread, which counts new replies instead.
 */
const useOwnChannelUnreadCount = ({ thread }: { thread: Thread | undefined }) => {
  const { client } = useChatContext();
  const channel = useChannel();
  const ownUserId = client.user?.id;
  // Selects the own count alone: other members' read and delivery updates replace the `read` map
  // too, and must not re-render the button.
  const ownUnreadCountSelector = useCallback(
    ({ read }: ChannelStateData) => ({
      unreadCount: ownUserId ? (read[ownUserId]?.unread_messages ?? 0) : 0,
    }),
    [ownUserId],
  );
  const { unreadCount = 0 } =
    useStateStore(thread ? undefined : channel.state, ownUnreadCountSelector) ?? {};

  return unreadCount;
};

/**
 * The number of replies other users posted to the thread while the list was scrolled up: the
 * growth of the parent message's `reply_count` since the user was last at the bottom.
 * Always 0 outside a thread.
 */
const useThreadNewReplyCount = ({
  isMessageListScrolledToBottom,
  thread,
}: {
  isMessageListScrolledToBottom?: boolean;
  thread: Thread | undefined;
}) => {
  const { client } = useChatContext();
  const channel = useChannel();
  const { parentMessage } = useStateStore(thread?.state, threadStateSelector) ?? {};
  const [newReplyCount, setNewReplyCount] = useState(0);
  // The parent's reply count when the user was last at the bottom, i.e. the replies already seen.
  const [seenReplyCount, setSeenReplyCount] = useState(parentMessage?.reply_count || 0);

  useEffect(() => {
    if (!isMessageListScrolledToBottom) return;
    setNewReplyCount(0);
    setSeenReplyCount(parentMessage?.reply_count || 0);
  }, [isMessageListScrolledToBottom, parentMessage]);

  useEffect(() => {
    if (!thread || isMessageListScrolledToBottom) return;

    const handleParentMessageUpdated = (event: EventPayload<'message.updated'>) => {
      const isParentMessage = event.message?.id === parentMessage?.id;
      const isOwnUpdate = event.user?.id === client.user?.id;
      if (!isParentMessage || isOwnUpdate) return;
      setNewReplyCount((event.message?.reply_count || 0) - seenReplyCount);
    };

    const subscription = channel.on('message.updated', handleParentMessageUpdated);
    return () => subscription.unsubscribe();
  }, [
    channel,
    client,
    isMessageListScrolledToBottom,
    parentMessage,
    seenReplyCount,
    thread,
  ]);

  return newReplyCount;
};

const UnMemoizedScrollToLatestMessageButton = (
  props: ScrollToLatestMessageButtonProps,
) => {
  const { IconArrowDown } = useComponentContextIcons();
  const {
    isMessageListScrolledToBottom,
    isNotAtLatestMessageSet = false,
    onClick,
  } = props;

  const { t } = useTranslationContext();
  const thread = useThreadContext();
  const ownChannelUnreadCount = useOwnChannelUnreadCount({ thread });
  const threadNewReplyCount = useThreadNewReplyCount({
    isMessageListScrolledToBottom,
    thread,
  });
  const unreadCount = thread ? threadNewReplyCount : ownChannelUnreadCount;

  if (isMessageListScrolledToBottom && !isNotAtLatestMessageSet) return null;

  return (
    <div className='str-chat__jump-to-latest-message'>
      <Button
        appearance='ghost'
        aria-label={t(
          'messageList.scrollLatestMessage.jumpLatestMessage.ariaLabel',
          'Jump to latest message',
        )}
        aria-live='polite'
        circular
        className='str-chat__jump-to-latest-message__button'
        data-testid='scroll-to-latest-message-button'
        onClick={onClick}
        size='md'
        variant='secondary'
      >
        <IconArrowDown />
      </Button>
      {unreadCount > 0 && (
        <Badge
          className='str-chat__jump-to-latest__unread-count'
          data-testid='unread-message-notification-counter'
          size='md'
          variant='primary'
        >
          {unreadCount}
        </Badge>
      )}
    </div>
  );
};

export const ScrollToLatestMessageButton = React.memo(
  UnMemoizedScrollToLatestMessageButton,
) as typeof UnMemoizedScrollToLatestMessageButton;
