import React from 'react';

export type MessageNotificationProps = {
  /** button click event handler */
  onClick: React.MouseEventHandler;
  /** Whether or not to show notification */
  showNotification: boolean;
};

const UnMemoizedMessageNotification: React.FC<MessageNotificationProps> = (props) => {
  const { children, onClick, showNotification = true } = props;

  if (!showNotification) return null;

  return (
    <button
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
