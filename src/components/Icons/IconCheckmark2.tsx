import { BaseIcon } from './BaseIcon';
import clsx from 'clsx';
import type { ComponentProps } from 'react';

export const IconCheckmark2 = ({ className, ...props }: ComponentProps<'svg'>) => (
  <BaseIcon
    {...props}
    className={clsx('str-chat__icon--checkmark2', className)}
    viewBox='0 0 16 16'
  >
    <path d='M13.6849 2.14261C13.8824 1.87654 14.2587 1.82105 14.5247 2.01858C14.7903 2.21611 14.8459 2.59154 14.6488 2.85745L6.48177 13.8574C6.38375 13.9895 6.23582 14.0758 6.07259 14.0957C5.90944 14.1156 5.74532 14.0674 5.61849 13.9629L1.4515 10.5254C1.19589 10.3145 1.15957 9.9363 1.37044 9.68069C1.58131 9.42509 1.95956 9.3888 2.21517 9.59964L5.89388 12.6348L13.6849 2.14261Z' />
  </BaseIcon>
);
