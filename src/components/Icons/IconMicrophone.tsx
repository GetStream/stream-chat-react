import type { ComponentProps } from 'react';
import clsx from 'clsx';

export const IconMicrophone = ({ className, ...props }: ComponentProps<'svg'>) => (
  <svg
    stroke='currentColor'
    viewBox='0 0 20 20'
    {...props}
    className={clsx('str-chat__icon--microphone', className)}
    xmlns='http://www.w3.org/2000/svg'
  >
    <path
      d='M10.0007 15.8332C12.5637 15.8332 14.7662 14.2906 15.7307 12.0832M10.0007 15.8332C7.43788 15.8332 5.23527 14.2906 4.27083 12.0832M10.0007 15.8332V17.7082M10.0007 13.1248C8.04476 13.1248 6.4591 11.5392 6.4591 9.58317V5.83317C6.4591 3.87716 8.04476 2.2915 10.0007 2.2915C11.9567 2.2915 13.5424 3.87716 13.5424 5.83317V9.58317C13.5424 11.5392 11.9567 13.1248 10.0007 13.1248Z'
      stroke='#384047'
    />
  </svg>
);
