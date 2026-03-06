import React, { useEffect, useState } from 'react';

import { useChannel, useChatContext } from '../../context';
import { useThreadContext } from '../Threads/ThreadContext';
import { useStateStore } from '../../store';

import type { Event, ThreadState } from 'stream-chat';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { IconArrowDown } from '../Icons';

type ScrollToLatestMessageButtonProps = {
  /** When true, user has jumped to an older message set and newer messages can be loaded */
  isNotAtLatestMessageSet?: boolean;
  isMessageListScrolledToBottom?: boolean;
  onClick: React.MouseEventHandler;
};

const threadStateSelector = ({ parentMessage }: ThreadState) => ({
  parentMessage,
});

const UnMemoizedScrollToLatestMessageButton = (
  props: ScrollToLatestMessageButtonProps,
) => {
  const {
    isMessageListScrolledToBottom,
    isNotAtLatestMessageSet = false,
    onClick,
  } = props;

  const { client } = useChatContext();
  const channel = useChannel();
  const thread = useThreadContext();
  const isThreadList = !!thread;
  const { parentMessage } = useStateStore(thread?.state, threadStateSelector) ?? {};
  const [countUnread, setCountUnread] = useState(channel.countUnread() || 0);
  const [replyCount, setReplyCount] = useState(parentMessage?.reply_count || 0);
  const observedEvent = isThreadList ? 'message.updated' : 'message.new';

  useEffect(() => {
    const handleEvent = (event: Event) => {
      const newMessageInAnotherChannel = event.cid !== channel?.cid;
      const newMessageIsMine = event.user?.id === client.user?.id;

      const newMessageIsReply = !!event.message?.parent_id;
      const dontIncreaseMainListCounterOnNewReply =
        channel && !isThreadList && newMessageIsReply;

      if (
        isMessageListScrolledToBottom ||
        newMessageInAnotherChannel ||
        newMessageIsMine ||
        dontIncreaseMainListCounterOnNewReply
      ) {
        return;
      }

      if (event.type === 'message.new') {
        // cannot rely on channel.countUnread because active channel is automatically marked read
        setCountUnread((prev) => prev + 1);
      } else if (event.message?.id === parentMessage?.id) {
        const newReplyCount = event.message?.reply_count || 0;
        setCountUnread(() => newReplyCount - replyCount);
      }
    };
    client.on(observedEvent, handleEvent);

    return () => {
      client.off(observedEvent, handleEvent);
    };
  }, [
    channel,
    client,
    isMessageListScrolledToBottom,
    observedEvent,
    parentMessage,
    replyCount,
    isThreadList,
  ]);

  useEffect(() => {
    if (isMessageListScrolledToBottom) {
      setCountUnread(0);
      setReplyCount(parentMessage?.reply_count || 0);
    }
  }, [isMessageListScrolledToBottom, parentMessage]);

  if (isMessageListScrolledToBottom && !isNotAtLatestMessageSet) return null;

  return (
    <div className='str-chat__jump-to-latest-message'>
      <Button
        appearance='outline'
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
      {countUnread > 0 && (
        <Badge
          className='str-chat__jump-to-latest__unread-count'
          data-testid='unread-message-notification-counter'
          size='md'
          variant='primary'
        >
          {countUnread}
        </Badge>
      )}
    </div>
  );
};

export const ScrollToLatestMessageButton = React.memo(
  UnMemoizedScrollToLatestMessageButton,
) as typeof UnMemoizedScrollToLatestMessageButton;
