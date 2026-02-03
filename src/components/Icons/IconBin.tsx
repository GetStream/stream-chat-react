import type { ComponentProps } from 'react';
import { BaseIcon } from './BaseIcon';
import clsx from 'clsx';

export const IconBin = ({ className, ...props }: ComponentProps<'svg'>) => (
  <BaseIcon
    {...props}
    className={clsx('str-chat__icon--bin', className)}
    viewBox='0 0 16 16'
  >
    <path d='M3.16699 4.33366L3.77041 12.9271C3.81945 13.6255 4.40033 14.167 5.10046 14.167H10.9002C11.6003 14.167 12.1812 13.6255 12.2303 12.9271L12.8337 4.33366M6.66699 7.00033V10.8337M9.33366 7.00033V10.8337M2.16699 3.83366H13.8337M5.68339 3.72225C5.82085 2.56467 6.80573 1.66699 8.00033 1.66699C9.19493 1.66699 10.1798 2.56467 10.3173 3.72225' />
  </BaseIcon>
);
