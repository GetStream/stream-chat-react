import { type ComponentProps } from 'react';
import clsx from 'clsx';
import { BaseIcon } from './BaseIcon';

export const IconClose = ({ className, ...props }: ComponentProps<'svg'>) => (
  <BaseIcon
    {...props}
    className={clsx('str-chat__icon--close', className)}
    viewBox='0 0 8 8'
  >
    <path d='M0.75 0.75L6.41667 6.41667M6.41667 0.75L0.75 6.41667' />
  </BaseIcon>
);
