import { type ComponentProps } from 'react';
import { BaseIcon } from './BaseIcon';
import clsx from 'clsx';

export const IconCross = ({ className, ...props }: ComponentProps<'svg'>) => (
  <BaseIcon
    {...props}
    className={clsx('str-chat__icon--cross', className)}
    viewBox='0 0 10 10'
  >
    <path d='M0.75 0.75L8.41667 8.41667M8.41667 0.75L0.75 8.41667' />
  </BaseIcon>
);
