import type { ComponentProps } from 'react';
import clsx from 'clsx';
import { BaseIcon } from './BaseIcon';

export const IconPlus = ({ className, ...props }: ComponentProps<'svg'>) => (
  <BaseIcon
    {...props}
    className={clsx('str-chat__icon--plus', className)}
    viewBox='0 0 16 16'
  >
    <path d='M7.625 0.75V7.625M7.625 7.625V14.5M7.625 7.625H0.75M7.625 7.625H14.5' />
  </BaseIcon>
);
