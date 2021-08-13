import React from 'react';

export const Flag: React.FC = () => (
  <svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' fill='none' viewBox='0 0 24 24'>
    <path
      fill='var(--primary-accent)'
      d='M0 12C0 5.373 5.373 0 12 0s12 5.373 12 12-5.373 12-12 12S0 18.627 0 12z'
    ></path>
    <path
      fill='#fff'
      fillRule='evenodd'
      d='M7.333 5.583a.583.583 0 00-1.167 0v12.834a.583.583 0 001.167 0V13.75h10.5l-1.75-3.792 1.75-3.791h-10.5v-.584zm0 1.75v5.25h8.677l-1.212-2.625 1.212-2.625H7.333z'
      clipRule='evenodd'
    ></path>
  </svg>
);
