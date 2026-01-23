import type { ComponentProps } from 'react';
import clsx from 'clsx';

export const IconPause = ({ className, ...props }: ComponentProps<'svg'>) => (
  <svg
    {...props}
    className={clsx('str-chat__icon--pause', className)}
    viewBox='0 0 20 20'
    xmlns='http://www.w3.org/2000/svg'
  >
    <path d='M5.62516 2.5C4.35951 2.5 3.3335 3.52602 3.3335 4.79167V15.2083C3.3335 16.474 4.35951 17.5 5.62516 17.5H6.04183C7.30748 17.5 8.3335 16.474 8.3335 15.2083V4.79167C8.3335 3.52602 7.30748 2.5 6.04183 2.5H5.62516Z' />
    <path d='M13.9585 2.5C12.6928 2.5 11.6668 3.52602 11.6668 4.79167V15.2083C11.6668 16.474 12.6928 17.5 13.9585 17.5H14.3752C15.6408 17.5 16.6668 16.474 16.6668 15.2083V4.79167C16.6668 3.52602 15.6408 2.5 14.3752 2.5H13.9585Z' />
  </svg>
);
