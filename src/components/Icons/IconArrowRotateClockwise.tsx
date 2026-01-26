import clsx from 'clsx';
import type { ComponentProps } from 'react';
import { BaseIcon } from './BaseIcon';

export const IconArrowRotateClockwise = ({
  className,
  ...props
}: ComponentProps<'svg'>) => (
  <BaseIcon
    {...props}
    className={clsx('str-chat__icon--arrow-rotate-clockwise', className)}
    viewBox='0 0 16 16'
  >
    <path d='M13.1734 9.83333C12.4183 11.9695 10.3811 13.5 7.98633 13.5C4.94877 13.5 2.48633 11.0375 2.48633 8C2.48633 4.96243 4.94877 2.5 7.98633 2.5C9.86446 2.5 11.1197 3.30292 12.3337 4.67261M12.8337 2.66667V4.83333C12.8337 5.10947 12.6098 5.33333 12.3337 5.33333H10.167' />
  </BaseIcon>
);
