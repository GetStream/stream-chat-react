import React, { useEffect, useState } from 'react';

import { useChannelStateContext, useChatContext } from '../../context';

import type { Event } from 'stream-chat';
import { Badge } from '../Badge';
import { Button } from '../Button';
import { IconArrowDown } from '../Icons';

type ScrollToLatestMessageButtonProps = {
  /** When true, user has jumped to an older message set and newer messages can be loaded */
  isNotAtLatestMessageSet?: boolean;
  isMessageListScrolledToBottom?: boolean;
  onClick: React.MouseEventHandler;
  threadList?: boolean;
};

const UnMemoizedScrollToLatestMessageButton = (
  props: ScrollToLatestMessageButtonProps,
) => {
  const {
    isMessageListScrolledToBottom,
    isNotAtLatestMessageSet = false,
    onClick,
    threadList,
  } = props;

  const { channel: activeChannel, client } = useChatContext();
  const { thread } = useChannelStateContext();
  const [countUnread, setCountUnread] = useState(activeChannel?.countUnread() || 0);
  const [replyCount, setReplyCount] = useState(thread?.reply_count || 0);
  const observedEvent = threadList ? 'message.updated' : 'message.new';

  useEffect(() => {
    const handleEvent = (event: Event) => {
      const newMessageInAnotherChannel = event.cid !== activeChannel?.cid;
      const newMessageIsMine = event.user?.id === client.user?.id;

      const isThreadOpen = !!thread;
      const newMessageIsReply = !!event.message?.parent_id;
      const dontIncreaseMainListCounterOnNewReply =
        isThreadOpen && !threadList && newMessageIsReply;

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
      } else if (event.message?.id === thread?.id) {
        const newReplyCount = event.message?.reply_count || 0;
        setCountUnread(() => newReplyCount - replyCount);
      }
    };
    client.on(observedEvent, handleEvent);

    return () => {
      client.off(observedEvent, handleEvent);
    };
  }, [
    activeChannel,
    client,
    isMessageListScrolledToBottom,
    observedEvent,
    replyCount,
    thread,
    threadList,
  ]);

  useEffect(() => {
    if (isMessageListScrolledToBottom) {
      setCountUnread(0);
      setReplyCount(thread?.reply_count || 0);
    }
  }, [isMessageListScrolledToBottom, thread]);

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
