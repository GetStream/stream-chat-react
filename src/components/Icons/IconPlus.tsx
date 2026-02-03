import type { ComponentProps } from 'react';
import clsx from 'clsx';
import { BaseIcon } from './BaseIcon';

export const IconPlus = ({ className, ...props }: ComponentProps<'svg'>) => (
  <BaseIcon
    {...props}
    className={clsx('str-chat__icon--plus', className)}
    viewBox='0 0 16 16'
  >
    <path d='M8 2.5V8M8 8V13.5M8 8H2.5M8 8H13.5' />
  </BaseIcon>
);
