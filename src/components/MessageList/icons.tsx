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

export const CloseIcon = () => (
  <svg fill='currentColor' viewBox='0 0 14 13' xmlns='http://www.w3.org/2000/svg'>
    <path d='M1.32227 12.3408C0.944336 11.9629 0.953125 11.3213 1.32227 10.9521L5.60254 6.66309L1.32227 2.38281C0.953125 2.01367 0.944336 1.37207 1.32227 0.994141C1.7002 0.616211 2.3418 0.625 2.71094 0.985352L7 5.27441L11.2803 0.994141C11.6494 0.625 12.291 0.616211 12.6689 0.994141C13.0469 1.37207 13.0381 2.01367 12.6689 2.38281L8.38867 6.66309L12.6689 10.9521C13.0381 11.3213 13.0469 11.9629 12.6689 12.3408C12.291 12.7188 11.6494 12.71 11.2803 12.3408L7 8.06055L2.71094 12.3408C2.3418 12.71 1.7002 12.7188 1.32227 12.3408Z' />
  </svg>
);
