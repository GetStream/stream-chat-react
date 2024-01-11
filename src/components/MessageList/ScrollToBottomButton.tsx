import React from 'react';
import clsx from 'clsx';

import { ArrowDown } from './icons';

import type { MessageNotificationProps } from './MessageNotification';

const UnMemoizedScrollToBottomButton = (
  props: Pick<
    MessageNotificationProps,
    'isMessageListScrolledToBottom' | 'onClick' | 'threadList' | 'unreadCount'
  >,
) => {
  const { isMessageListScrolledToBottom, onClick, unreadCount = 0 } = props;

  if (isMessageListScrolledToBottom) return null;

  return (
    <div className='str-chat__jump-to-latest-message'>
      <button
        aria-live='polite'
        className={`
        str-chat__message-notification-right
        str-chat__message-notification-scroll-to-latest
        str-chat__circle-fab
      `}
        data-testid='message-notification'
        onClick={onClick}
      >
        <ArrowDown />
        {unreadCount > 0 && (
          <div
            className={clsx(
              'str-chat__message-notification',
              'str-chat__message-notification-scroll-to-latest-unread-count',
              'str-chat__jump-to-latest-unread-count',
            )}
            data-testid={'unread-message-notification-counter'}
          >
            {unreadCount}
          </div>
        )}
      </button>
    </div>
  );
};

export const ScrollToBottomButton = React.memo(
  UnMemoizedScrollToBottomButton,
) as typeof UnMemoizedScrollToBottomButton;
