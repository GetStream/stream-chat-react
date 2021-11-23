import React from 'react';

export type CustomNotificationProps = {
  type: string;
  active?: boolean;
};

const UnMemoizedCustomNotification: React.FC<CustomNotificationProps> = (props) => {
  const { active, children, type } = props;

  if (!active) return null;

  return (
    <div
      aria-live='polite'
      className={`str-chat__custom-notification notification-${type}`}
      data-testid='custom-notification'
      role='log'
    >
      {children}
    </div>
  );
};

export const CustomNotification = React.memo(
  UnMemoizedCustomNotification,
) as typeof UnMemoizedCustomNotification;
