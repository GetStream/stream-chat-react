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
      className={`str-chat__custom-notification notification-${type}`}
      data-testid='custom-notification'
    >
      {children}
    </div>
  );
};

export const CustomNotification = React.memo(
  UnMemoizedCustomNotification,
) as typeof UnMemoizedCustomNotification;
