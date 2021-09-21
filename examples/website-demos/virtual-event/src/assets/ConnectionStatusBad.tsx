import React from 'react';

export const ConnectionStatusBad: React.FC = () => (
  <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' fill='none' viewBox='0 0 24 24'>
    <path
      fill='#000'
      fillOpacity='0.8'
      d='M0 6a6 6 0 016-6h12a6 6 0 016 6v12a6 6 0 01-6 6H6a6 6 0 01-6-6V6z'
    ></path>
    <path
      stroke='#fff'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth='2'
      d='M12 16v-5'
    ></path>
    <path
      stroke='red'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth='2'
      d='M7 16v-2'
    ></path>
    <path
      stroke='#fff'
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth='2'
      d='M17 16V8'
    ></path>
  </svg>
);
