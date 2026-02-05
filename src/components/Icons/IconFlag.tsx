import clsx from 'clsx';
import type { ComponentProps } from 'react';

export const IconFlag = ({ className, ...props }: ComponentProps<'svg'>) => (
  <svg {...props} className={clsx('str-chat__icon--flag', className)} viewBox='0 0 16 16'>
    <path d='M3.1665 10.0552V2.93244C3.1665 2.67878 3.31 2.4429 3.5458 2.34938C6.52495 1.16784 8.92484 3.59004 11.8271 2.88676C12.3074 2.77037 12.8332 3.09694 12.8332 3.59113V9.64104C12.8332 9.8947 12.6897 10.1306 12.4539 10.224C9.13764 11.5393 6.53917 8.3891 3.1665 10.0552ZM3.1665 10.0552V14.1664' />
  </svg>
);
