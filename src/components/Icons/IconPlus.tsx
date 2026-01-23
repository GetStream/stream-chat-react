import type { ComponentProps } from 'react';
import clsx from 'clsx';

export const IconPlus = ({ className, ...props }: ComponentProps<'svg'>) => (
  <svg
    stroke='currentColor'
    {...props}
    className={clsx('str-chat__icon--plus', className)}
    viewBox='0 0 16 16'
    xmlns='http://www.w3.org/2000/svg'
  >
    <path d='M7.625 0.75V7.625M7.625 7.625V14.5M7.625 7.625H0.75M7.625 7.625H14.5' />
  </svg>
);
