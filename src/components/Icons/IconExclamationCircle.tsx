import type { ComponentProps } from 'react';
import clsx from 'clsx';

export const IconExclamationCircle = ({ className, ...props }: ComponentProps<'svg'>) => (
  <svg
    {...props}
    className={clsx('str-chat__icon--exclamation-circle', className)}
    viewBox='0 0 13.3333 13.3333'
    xmlns='http://www.w3.org/2000/svg'
  >
    <path
      clipRule='evenodd'
      d='M6.66667 0C10.3485 0 13.3333 2.98477 13.3333 6.66667C13.3333 10.3485 10.3485 13.3333 6.66667 13.3333C2.98477 13.3333 0 10.3485 0 6.66667C0 2.98477 2.98477 0 6.66667 0ZM6.66667 8.33333C6.29847 8.33333 6 8.6318 6 9C6.00007 9.36807 6.29851 9.66667 6.66667 9.66667C7.03482 9.66667 7.33326 9.36807 7.33333 9C7.33333 8.6318 7.03487 8.33333 6.66667 8.33333ZM6.66667 4C6.39053 4 6.16667 4.22385 6.16667 4.5V7.16667C6.16674 7.44274 6.39058 7.66667 6.66667 7.66667C6.94275 7.66667 7.16659 7.44274 7.16667 7.16667V4.5C7.16667 4.22385 6.9428 4 6.66667 4Z'
      fillRule='evenodd'
    />
  </svg>
);
