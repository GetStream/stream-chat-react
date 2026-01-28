import type { ComponentProps } from 'react';
import clsx from 'clsx';
import { BaseIcon } from './BaseIcon';

export const IconCommand = ({ className, ...props }: ComponentProps<'svg'>) => (
  <BaseIcon
    {...props}
    className={clsx('str-chat__icon--command', className)}
    viewBox='0 0 16 16'
  >
    <path d='M6.5 11.1667L9.5 4.83333M3.83333 2.5H12.1667C12.9031 2.5 13.5 3.09695 13.5 3.83333V12.1667C13.5 12.9031 12.9031 13.5 12.1667 13.5H3.83333C3.09695 13.5 2.5 12.9031 2.5 12.1667V3.83333C2.5 3.09695 3.09695 2.5 3.83333 2.5Z' />
  </BaseIcon>
);
