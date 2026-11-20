import clsx from 'clsx';
import React from 'react';

import { useComponentContextIcons } from '../../context';
import { ScheduleMessageNoticeSeverity } from './constants';
import type { ScheduleMessageDialogNoticeProps } from './types';

export const ScheduleMessageDialogNotice = ({
  children,
  severity,
}: ScheduleMessageDialogNoticeProps) => {
  const { IconExclamationCircleFill, IconInfo } = useComponentContextIcons();

  const isError = severity === ScheduleMessageNoticeSeverity.Error;
  const Icon = isError ? IconExclamationCircleFill : IconInfo;

  return (
    <div
      className={clsx(
        'str-chat__schedule-message-dialog__notice',
        `str-chat__schedule-message-dialog__notice--${severity}`,
      )}
      role={isError ? 'alert' : 'status'}
    >
      <Icon className='str-chat__schedule-message-dialog__notice-icon' />
      <span className='str-chat__schedule-message-dialog__notice-text'>{children}</span>
    </div>
  );
};
