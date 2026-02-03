import { type ComponentProps } from 'react';
import { BaseIcon } from './BaseIcon';
import clsx from 'clsx';

export const IconCheckmark = ({ className, ...props }: ComponentProps<'svg'>) => (
  <BaseIcon
    {...props}
    className={clsx('str-chat__icon--checkmark', className)}
    viewBox='0 0 16 16'
    xmlns='http://www.w3.org/2000/svg'
  >
    <path d='M1.83301 10.0625L5.99967 13.5L14.1663 2.5' />
  </BaseIcon>
);
