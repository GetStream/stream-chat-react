import React from 'react';
import type { MessageNotificationProps } from './MessageNotification';
import { ArrowDown } from './icons';

const UnMemoizedScrollToBottomButton = (props: Omit<MessageNotificationProps, 'children'>) => {
  const { className = '', onClick, showNotification = true } = props;

  if (!showNotification) return null;

  return (
    <div className='str-chat__jump-to-latest-message'>
      <button
        aria-live='polite'
        className={`
        str-chat__message-notification-right
        str-chat__message-notification-scroll-to-latest
        str-chat__circle-fab
        ${className}
      `}
        data-testid='message-notification'
        onClick={onClick}
      >
        <ArrowDown />
      </button>
    </div>
  );
};

export const ScrollToBottomButton = React.memo(
  UnMemoizedScrollToBottomButton,
) as typeof UnMemoizedScrollToBottomButton;
