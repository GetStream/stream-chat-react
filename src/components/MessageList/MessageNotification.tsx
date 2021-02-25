// @ts-check
import React, { FC, MouseEventHandler } from 'react';

export interface MessageNotificationProps {
  /** button click event handler */
  onClick: MouseEventHandler;
  /** Wether or not to show notification */
  showNotification: boolean;
}

const UnmemoizedMessageNotification: FC<MessageNotificationProps> = ({
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

UnmemoizedMessageNotification.defaultProps = {
  showNotification: true,
};

export const MessageNotification = React.memo(UnmemoizedMessageNotification);
