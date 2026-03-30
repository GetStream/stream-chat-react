import type { ComponentProps } from 'react';
import { BaseIcon } from './BaseIcon';
import clsx from 'clsx';

// was: IconGiphy (updated icon asset)
export const IconGiphy = ({ className, ...props }: ComponentProps<'svg'>) => (
  <BaseIcon
    {...props}
    className={clsx('str-chat__icon--giphy', className)}
    viewBox='0 0 16 16'
  >
    <rect fill='black' height='16' rx='8' width='16' />
    <path
      clipRule='evenodd'
      d='M5.27976 4.40015H10.7206V11.5999H5.2793L5.27976 4.40015Z'
      fill='black'
      fillRule='evenodd'
    />
    <path d='M4.19189 4.1333H5.27969V11.8669H4.19189V4.1333Z' fill='#04FF8E' />
    <path d='M10.7202 6.26685H11.808V11.8668H10.7202V6.26685Z' fill='#8E2EFF' />
    <path d='M4.19189 11.5999H11.8079V12.6667H4.19189V11.5999Z' fill='#00C5FF' />
    <path d='M4.19189 3.33325H8.54403V4.40005H4.19189V3.33325Z' fill='#FFF152' />
    <path
      d='M10.72 5.46638V4.40005H9.63174V3.33325H8.54395V6.53318H11.8078V5.46638'
      fill='#FF5B5B'
    />
    <path d='M10.7202 7.6V6.5332H11.808' fill='#551C99' />
    <path
      clipRule='evenodd'
      d='M8.54432 3.33325V4.40005H7.45605'
      fill='#999131'
      fillRule='evenodd'
    />
  </BaseIcon>
);
