import clsx from 'clsx';
import type { ComponentProps } from 'react';
import { BaseIcon } from './BaseIcon';

export const IconPoll = ({ className, ...props }: ComponentProps<'svg'>) => (
  <BaseIcon
    {...props}
    className={clsx('str-chat__icon--poll', className)}
    viewBox='0 0 12 12'
  >
    <path d='M4.625 10.125V6.875H2.375C2.09886 6.875 1.875 7.09885 1.875 7.375V9.625C1.875 9.90115 2.09886 10.125 2.375 10.125H4.625ZM4.625 10.125H7.375M4.625 10.125V2.375C4.625 2.09886 4.84886 1.875 5.125 1.875H6.875C7.15115 1.875 7.375 2.09886 7.375 2.375V10.125M7.375 10.125H9.875C10.0131 10.125 10.125 10.0131 10.125 9.875V4.875C10.125 4.59886 9.90115 4.375 9.625 4.375H7.375V10.125Z' />
  </BaseIcon>
);
