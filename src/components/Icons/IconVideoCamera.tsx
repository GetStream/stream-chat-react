import type { ComponentProps } from 'react';
import clsx from 'clsx';
import { BaseIcon } from './BaseIcon';

export const IconVideoCamera = ({ className, ...props }: ComponentProps<'svg'>) => (
  <BaseIcon
    {...props}
    className={clsx('str-chat__icon--video-camera', className)}
    viewBox='0 0 10 8'
  >
    <path
      clipRule='evenodd'
      d='M0 1.375C0 0.61561 0.61561 0 1.375 0H5.625C6.3844 0 7 0.61561 7 1.375V2.39346L8.7337 1.52661C9.3155 1.23571 10 1.65878 10 2.30924V5.6912C10 6.34165 9.3155 6.7647 8.7337 6.4738L7 5.607V6.625C7 7.3844 6.3844 8 5.625 8H1.375C0.61561 8 0 7.3844 0 6.625V1.375Z'
      fillRule='evenodd'
    />
  </BaseIcon>
);
