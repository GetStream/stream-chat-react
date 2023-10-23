import React from 'react';
import { ReactMarkdownProps } from 'react-markdown/lib/complex-types';

export const Emoji = ({ children }: ReactMarkdownProps) => (
  <span className='inline-text-emoji' data-testid='inline-text-emoji'>
    {children}
  </span>
);
