import React, { FC, MouseEventHandler } from 'react';

export interface MessageNotificationProps {
  children: React.ReactNode;
  /** button click event handler */
  onClick: MouseEventHandler;
  /** Wether or not to show notification */
  showNotification: boolean;
}

const UnMemoizedMessageNotification: FC<MessageNotificationProps> = ({
  children,
  onClick,
  showNotification,
}) => {
  if (!showNotification) {
    return null;
  }

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

UnMemoizedMessageNotification.defaultProps = {
  showNotification: true,
};

export const MessageNotification = React.memo(UnMemoizedMessageNotification);
