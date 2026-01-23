import { type ComponentProps } from 'react';
import clsx from 'clsx';

export const IconClose = ({ className, ...props }: ComponentProps<'svg'>) => (
  <svg
    {...props}
    className={clsx('str-chat__icon--close', className)}
    viewBox='0 0 8 8'
    xmlns='http://www.w3.org/2000/svg'
  >
    <path d='M0.75 0.75L6.41667 6.41667M6.41667 0.75L0.75 6.41667' />
  </svg>
);
