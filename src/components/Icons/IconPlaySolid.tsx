import clsx from 'clsx';
import type { ComponentProps } from 'react';

export const IconPlaySolid = ({ className, ...props }: ComponentProps<'svg'>) => (
  <svg
    {...props}
    className={clsx('str-chat__icon--play-solid', className)}
    viewBox='0 0 20 20'
    xmlns='http://www.w3.org/2000/svg'
  >
    <path d='M7.70312 1.97298C6.17833 0.986351 4.1665 2.08084 4.1665 3.89699V16.1032C4.1665 17.9193 6.17833 19.0138 7.70312 18.0272L17.1352 11.9241C18.5308 11.0211 18.5308 8.97917 17.1352 8.07608L7.70312 1.97298Z' />
  </svg>
);
