import React from 'react';

interface ArrowProps {
  className?: string;
  color?: string;
}

export const ArrowUp = ({ className, color }: ArrowProps) => (
  <svg
    className={className}
    data-testid='arrow-up'
    fill='none'
    height='24'
    viewBox='0 0 24 24'
    width='24'
    xmlns='http://www.w3.org/2000/svg'
  >
    <path
      d='M16.59 15.7051L12 11.1251L7.41 15.7051L6 14.2951L12 8.29508L18 14.2951L16.59 15.7051Z'
      fill={color || 'var(--primary-color)'}
    />
  </svg>
);

export const ArrowDown = ({ className, color }: ArrowProps) => (
  <svg
    className={className}
    data-testid='arrow-down'
    fill='none'
    height='24'
    viewBox='0 0 24 24'
    width='24'
    xmlns='http://www.w3.org/2000/svg'
  >
    <path
      d='M7.41 8.29504L12 12.875L16.59 8.29504L18 9.70504L12 15.705L6 9.70504L7.41 8.29504Z'
      fill={color || 'var(--primary-color)'}
    />
  </svg>
);
