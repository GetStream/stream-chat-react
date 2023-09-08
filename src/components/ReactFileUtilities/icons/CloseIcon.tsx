import React from 'react';

export const CloseIcon = () => (
  <svg
    height='28'
    viewBox='0 0 28 28'
    width='28'
    xmlns='http://www.w3.org/2000/svg'
    xmlnsXlink='http://www.w3.org/1999/xlink'
  >
    <defs>
      <path
        d='M465 5c5.53 0 10 4.47 10 10s-4.47 10-10 10-10-4.47-10-10 4.47-10 10-10zm3.59 5L465 13.59 461.41 10 460 11.41l3.59 3.59-3.59 3.59 1.41 1.41 3.59-3.59 3.59 3.59 1.41-1.41-3.59-3.59 3.59-3.59-1.41-1.41z'
        id='b'
      />
      <filter filterUnits='objectBoundingBox' height='160%' id='a' width='160%' x='-30%' y='-30%'>
        <feOffset in='SourceAlpha' result='shadowOffsetOuter1' />
        <feGaussianBlur in='shadowOffsetOuter1' result='shadowBlurOuter1' stdDeviation='2' />
        <feColorMatrix in='shadowBlurOuter1' values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.5 0' />
      </filter>
    </defs>
    <g fill='none' fillRule='nonzero' transform='translate(-451 -1)'>
      <use fill='#000' filter='url(#a)' xlinkHref='#b' />
      <use fill='#FFF' fillRule='evenodd' xlinkHref='#b' />
    </g>
  </svg>
);
