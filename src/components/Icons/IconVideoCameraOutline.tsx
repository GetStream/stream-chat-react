import type { ComponentProps } from 'react';
import clsx from 'clsx';
import { BaseIcon } from './BaseIcon';

export const IconVideoCameraOutline = ({
  className,
  ...props
}: ComponentProps<'svg'>) => (
  <BaseIcon
    {...props}
    className={clsx('str-chat__icon--video-camera-outline', className)}
    viewBox='0 0 12 12'
  >
    <path d='M1.375 3.375C1.375 2.82271 1.82271 2.375 2.375 2.375H6.625C7.1773 2.375 7.625 2.82271 7.625 3.375V8.625C7.625 9.1773 7.1773 9.625 6.625 9.625H2.375C1.82271 9.625 1.375 9.1773 1.375 8.625V3.375Z' />
    <path d='M7.625 5L9.9014 3.8618C10.2338 3.69558 10.625 3.93732 10.625 4.30901V7.691C10.625 8.06265 10.2338 8.3044 9.9014 8.1382L7.625 7V5Z' />
  </BaseIcon>
);
