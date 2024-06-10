import React from 'react';
import { ComponentPropsWithoutRef } from 'react';

export const Icon = {
  // eslint-disable-next-line react/display-name
  MessageBubble: (props: ComponentPropsWithoutRef<'svg'>) => (
    <svg
      fill='none'
      height='14'
      viewBox='0 0 14 14'
      width='14'
      xmlns='http://www.w3.org/2000/svg'
      {...props}
    >
      <path
        d='M1.66659 1.66665H12.3333V9.66665H2.44659L1.66659 10.4466V1.66665ZM1.66659 0.333313C0.933252 0.333313 0.339919 0.933313 0.339919 1.66665L0.333252 13.6666L2.99992 11H12.3333C13.0666 11 13.6666 10.4 13.6666 9.66665V1.66665C13.6666 0.933313 13.0666 0.333313 12.3333 0.333313H1.66659ZM2.99992 6.99998H10.9999V8.33331H2.99992V6.99998ZM2.99992 4.99998H10.9999V6.33331H2.99992V4.99998ZM2.99992 2.99998H10.9999V4.33331H2.99992V2.99998Z'
        fill='currentColor'
      />
    </svg>
  ),
  // eslint-disable-next-line react/display-name
  Reload: (props: ComponentPropsWithoutRef<'svg'>) => (
    <svg
      fill='none'
      height='22'
      viewBox='0 0 16 22'
      width='16'
      xmlns='http://www.w3.org/2000/svg'
      {...props}
    >
      <path
        d='M8 3V0L4 4L8 8V5C11.31 5 14 7.69 14 11C14 12.01 13.75 12.97 13.3 13.8L14.76 15.26C15.54 14.03 16 12.57 16 11C16 6.58 12.42 3 8 3ZM8 17C4.69 17 2 14.31 2 11C2 9.99 2.25 9.03 2.7 8.2L1.24 6.74C0.46 7.97 0 9.43 0 11C0 15.42 3.58 19 8 19V22L12 18L8 14V17Z'
        fill='currentColor'
      />
    </svg>
  ),
};
