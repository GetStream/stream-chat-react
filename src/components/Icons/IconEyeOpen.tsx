import { BaseIcon } from './BaseIcon';
import clsx from 'clsx';
import type { ComponentProps } from 'react';

export const IconEyeOpen = ({ className, ...props }: ComponentProps<'svg'>) => (
  <BaseIcon
    {...props}
    className={clsx('str-chat__icon--eye-open', className)}
    viewBox='0 0 16 16'
  >
    <path
      clipRule='evenodd'
      d='M8 2.66699C10.5861 2.66701 13.1053 4.21304 14.7876 7.16533C15.0826 7.68299 15.0826 8.31766 14.7876 8.83539C13.1053 11.7877 10.5861 13.3337 8 13.3336C5.41395 13.3336 2.89477 11.7876 1.21246 8.83526C0.917461 8.31759 0.917461 7.68293 1.21246 7.16526C2.89477 4.21297 5.41395 2.66697 8 2.66699ZM5.58335 8.00033C5.58335 6.66564 6.66533 5.58366 8 5.58366C9.33473 5.58366 10.4167 6.66564 10.4167 8.00033C10.4167 9.33499 9.33473 10.417 8 10.417C6.66533 10.417 5.58335 9.33499 5.58335 8.00033Z'
      fillRule='evenodd'
    />
  </BaseIcon>
);
