import React, { PropsWithChildren } from 'react';

export type MessageNotificationProps = {
  /** button click event handler */
  onClick: React.MouseEventHandler;
  /** Whether or not to show notification */
  showNotification: boolean;
};

const UnMemoizedMessageNotification = (props: PropsWithChildren<MessageNotificationProps>) => {
  const { children, onClick, showNotification = true } = props;

  if (!showNotification) return null;

  return (
    <button
      aria-live='polite'
      className='str-chat__message-notification'
      data-testid='message-notification'
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export const MessageNotification = React.memo(
  UnMemoizedMessageNotification,
) as typeof UnMemoizedMessageNotification;
