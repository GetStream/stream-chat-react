import React from 'react';

/** Three dots for typing indicator; fill and opacity animation come from TypingIndicator.scss (--chat-text-typing-indicator). */
export const TypingIndicatorDots = () => (
  <svg
    aria-hidden
    fill='none'
    height='5'
    viewBox='0 0 23 5'
    width='23'
    xmlns='http://www.w3.org/2000/svg'
  >
    <circle cx='2.5' cy='2.5' r='2.5' />
    <circle cx='11.5' cy='2.5' r='2.5' />
    <circle cx='20.5' cy='2.5' r='2.5' />
  </svg>
);
