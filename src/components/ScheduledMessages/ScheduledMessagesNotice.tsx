import clsx from 'clsx';
import React from 'react';

import { useComponentContextIcons } from '../../context';

export type ScheduledMessagesNoticeProps = {
  children: string;
  className?: string;
  isError?: boolean;
};

/** A tinted line of information or error, as the scheduling dialogs and the list show it. */
export const ScheduledMessagesNotice = ({
  children,
  className,
  isError,
}: ScheduledMessagesNoticeProps) => {
  const { IconExclamationCircleFill, IconInfo } = useComponentContextIcons();
  const Icon = isError ? IconExclamationCircleFill : IconInfo;
  return (
    <div
      className={clsx(
        'str-chat__scheduled-messages-notice',
        `str-chat__scheduled-messages-notice--${isError ? 'error' : 'info'}`,
        className,
      )}
      role={isError ? 'alert' : 'status'}
    >
      <Icon className='str-chat__scheduled-messages-notice__icon' />
      <span className='str-chat__scheduled-messages-notice__text'>{children}</span>
    </div>
  );
};
