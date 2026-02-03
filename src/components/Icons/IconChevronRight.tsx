import clsx from 'clsx';
import type { ComponentProps } from 'react';
import { BaseIcon } from './BaseIcon';

export const IconChevronRight = ({ className, ...props }: ComponentProps<'svg'>) => (
  <BaseIcon
    {...props}
    className={clsx('str-chat__icon--chevron-right', className)}
    viewBox='0 0 16 16'
  >
    <path d='M6.3335 12.1668L10.5002 8.00016L6.3335 3.8335' />
  </BaseIcon>
);
