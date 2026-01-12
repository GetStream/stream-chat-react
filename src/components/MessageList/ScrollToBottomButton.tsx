import React, { useEffect, useState } from 'react';
import clsx from 'clsx';

import { ArrowDown } from './icons';

import { useChatContext } from '../../context';

import type { Event } from 'stream-chat';
import type { MessageNotificationProps } from './MessageNotification';

const thread = { id: 'x' };

const UnMemoizedScrollToBottomButton = (
  props: Pick<
    MessageNotificationProps,
    'isMessageListScrolledToBottom' | 'onClick' | 'threadList'
  >,
) => {
  const { isMessageListScrolledToBottom, onClick, threadList } = props;

  const { channel: activeChannel, client } = useChatContext();
  // const { thread } = useChannelStateContext();
  const [countUnread, setCountUnread] = useState<number>(
    activeChannel?.countUnread() || 0,
  );
  const [replyCount, setReplyCount] = useState(0); //useState(thread?.reply_count || 0);
  const observedEvent = threadList ? 'message.updated' : 'message.new';
  const isThreadOpen = false;

  useEffect(() => {
    const handleEvent = (event: Event) => {
      const newMessageInAnotherChannel = event.cid !== activeChannel?.cid;
      const newMessageIsMine = event.user?.id === client.user?.id;

      // const isThreadOpen = !!thread;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChannel, isMessageListScrolledToBottom, observedEvent, replyCount, thread]);

  useEffect(() => {
    if (isMessageListScrolledToBottom) {
      setCountUnread(0);
      // setReplyCount(thread?.reply_count || 0);
    }
  }, [isMessageListScrolledToBottom]);

  if (isMessageListScrolledToBottom) return null;

  return (
    <div className='str-chat__jump-to-latest-message'>
      <button
        aria-live='polite'
        className={`
        str-chat__message-notification-scroll-to-latest
        str-chat__circle-fab
      `}
        data-testid='message-notification'
        onClick={onClick}
      >
        <ArrowDown />
        {countUnread > 0 && (
          <div
            className={clsx(
              'str-chat__message-notification',
              'str-chat__jump-to-latest-unread-count',
            )}
            data-testid={'unread-message-notification-counter'}
          >
            {countUnread}
          </div>
        )}
      </button>
    </div>
  );
};

export const ScrollToBottomButton = React.memo(
  UnMemoizedScrollToBottomButton,
) as typeof UnMemoizedScrollToBottomButton;
