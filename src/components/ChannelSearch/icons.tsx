import React from 'react';
import type { IconProps } from '../../types/types';

export const MenuIcon = () => (
  <svg
    data-testid='menu-icon'
    fill='none'
    height='24'
    viewBox='0 0 24 24'
    width='24'
    xmlns='http://www.w3.org/2000/svg'
  >
    <path
      clipRule='evenodd'
      d='M3 8V6H21V8H3ZM3 13H21V11H3V13ZM3 18H21V16H3V18Z'
      fill='black'
      fillRule='evenodd'
    />
  </svg>
);

export const ReturnIcon = () => (
  <svg
    data-testid='return-icon'
    fill='none'
    height='20'
    viewBox='0 0 22 22'
    width='20'
    xmlns='http://www.w3.org/2000/svg'
  >
    <path
      d='M21.6668 9.66666V12.3333H5.6529L12.9932 19.6736L11.1076 21.5592L0.54834 11L11.1076 0.440765L12.9932 2.32638L5.6529 9.66666H21.6668Z'
      fill='#080707'
    />
  </svg>
);

export const XIcon = () => (
  <svg fill='none' height='14' viewBox='0 0 14 14' width='14' xmlns='http://www.w3.org/2000/svg'>
    <path
      d='M14 1.41L12.59 0L7 5.59L1.41 0L0 1.41L5.59 7L0 12.59L1.41 14L7 8.41L12.59 14L14 12.59L8.41 7L14 1.41Z'
      fill='#747881'
    />
  </svg>
);

export const SearchIcon = ({ className }: IconProps) => (
  <svg
    className={className}
    fill='none'
    height='18'
    viewBox='0 0 18 18'
    width='18'
    xmlns='http://www.w3.org/2000/svg'
  >
    <path
      d='M12.7549 11.255H11.9649L11.6849 10.985C12.6649 9.845 13.2549 8.365 13.2549 6.755C13.2549 3.165 10.3449 0.255005 6.75488 0.255005C3.16488 0.255005 0.254883 3.165 0.254883 6.755C0.254883 10.345 3.16488 13.255 6.75488 13.255C8.36488 13.255 9.84488 12.665 10.9849 11.685L11.2549 11.965V12.755L16.2549 17.745L17.7449 16.255L12.7549 11.255ZM6.75488 11.255C4.26488 11.255 2.25488 9.245 2.25488 6.755C2.25488 4.26501 4.26488 2.255 6.75488 2.255C9.24488 2.255 11.2549 4.26501 11.2549 6.755C11.2549 9.245 9.24488 11.255 6.75488 11.255Z'
      fill='#747881'
    />
  </svg>
);
