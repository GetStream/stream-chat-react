import clsx from 'clsx';
import { BaseIcon } from './BaseIcon';
import type { ComponentProps } from 'react';

export const IconPaperclip = ({ className, ...props }: ComponentProps<'svg'>) => (
  <BaseIcon
    {...props}
    className={clsx('str-chat__icon--paperclip', className)}
    viewBox='0 0 16 16'
  >
    <path d='M3.83301 7.16683V10.1668C3.83301 12.376 5.62387 14.1668 7.83301 14.1668H8.16634C10.3755 14.1668 12.1663 12.376 12.1663 10.1668V4.66683C12.1663 3.10202 10.8978 1.8335 9.33301 1.8335C7.76821 1.8335 6.49967 3.10202 6.49967 4.66683V9.91683C6.49967 10.6992 7.13394 11.3335 7.91634 11.3335C8.69874 11.3335 9.33301 10.6992 9.33301 9.91683V5.16683' />
  </BaseIcon>
);
