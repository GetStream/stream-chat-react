import type { ComponentProps } from 'react';
import clsx from 'clsx';
import { BaseIcon } from './BaseIcon';

export const IconFile = ({ className, ...props }: ComponentProps<'svg'>) => (
  <BaseIcon
    {...props}
    className={clsx('str-chat__icon--file', className)}
    viewBox='0 0 12 12'
  >
    <path d='M6.375 1.625V3.625C6.375 4.17729 6.8227 4.625 7.375 4.625H9.375M5.9608 1.375H3.375C2.82271 1.375 2.375 1.82271 2.375 2.375V9.625C2.375 10.1773 2.82271 10.625 3.375 10.625H8.625C9.1773 10.625 9.625 10.1773 9.625 9.625V5.0392C9.625 4.77399 9.51965 4.51965 9.3321 4.33211L6.6679 1.66789C6.48035 1.48035 6.226 1.375 5.9608 1.375Z' />
  </BaseIcon>
);
