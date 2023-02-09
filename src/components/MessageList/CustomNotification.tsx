import React, { PropsWithChildren } from 'react';
import clsx from 'clsx';

export type CustomNotificationProps = {
  type: string;
  active?: boolean;
  className?: string;
};

const UnMemoizedCustomNotification = (props: PropsWithChildren<CustomNotificationProps>) => {
  const { active, children, className, type } = props;

  if (!active) return null;

  return (
    <div
      aria-live='polite'
      className={clsx(
        `str-chat__custom-notification notification-${type}`,
        `str-chat__notification`,
        className,
      )}
      data-testid='custom-notification'
    >
      {children}
    </div>
  );
};

export const CustomNotification = React.memo(
  UnMemoizedCustomNotification,
) as typeof UnMemoizedCustomNotification;
