import React, { FC } from 'react';

export interface CustomNotificationProps {
  children: React.ReactNode;
  type: string;
  active?: boolean;
}

const UnMemoizedCustomNotification: FC<CustomNotificationProps> = ({
  active,
  children,
  type,
}) => {
  if (!active) return null;

  return (
    <div
      className={`str-chat__custom-notification notification-${type}`}
      data-testid='custom-notification'
    >
      {children}
    </div>
  );
};

export const CustomNotification = React.memo(UnMemoizedCustomNotification);
