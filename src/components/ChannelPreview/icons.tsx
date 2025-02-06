import React from 'react';
import type { ComponentPropsWithoutRef } from 'react';

export const Icon = {
  ArchiveBox: (props: ComponentPropsWithoutRef<'svg'>) => (
    <svg
      className='str-chat__icon str-chat__icon--archive-box'
      fill='currentColor'
      viewBox='0 0 512 512'
      xmlns='http://www.w3.org/2000/svg'
      {...props}
    >
      <path d='M32 32l448 0c17.7 0 32 14.3 32 32l0 32c0 17.7-14.3 32-32 32L32 128C14.3 128 0 113.7 0 96L0 64C0 46.3 14.3 32 32 32zm0 128l448 0 0 256c0 35.3-28.7 64-64 64L96 480c-35.3 0-64-28.7-64-64l0-256zm128 80c0 8.8 7.2 16 16 16l160 0c8.8 0 16-7.2 16-16s-7.2-16-16-16l-160 0c-8.8 0-16 7.2-16 16z' />
    </svg>
  ),
  Pin: (props: ComponentPropsWithoutRef<'svg'>) => (
    <svg
      className='str-chat__icon str-chat__icon--pin'
      fill='currentColor'
      viewBox='0 0 384 512'
      xmlns='http://www.w3.org/2000/svg'
      {...props}
    >
      <path d='M32 32C32 14.3 46.3 0 64 0L320 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-29.5 0 11.4 148.2c36.7 19.9 65.7 53.2 79.5 94.7l1 3c3.3 9.8 1.6 20.5-4.4 28.8s-15.7 13.3-26 13.3L32 352c-10.3 0-19.9-4.9-26-13.3s-7.7-19.1-4.4-28.8l1-3c13.8-41.5 42.8-74.8 79.5-94.7L93.5 64 64 64C46.3 64 32 49.7 32 32zM160 384l64 0 0 96c0 17.7-14.3 32-32 32s-32-14.3-32-32l0-96z' />
    </svg>
  ),
};
