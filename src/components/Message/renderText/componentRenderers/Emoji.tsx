import React from 'react';
import type { PropsWithChildrenOnly } from '../../../../types/types';

export const Emoji = ({ children }: PropsWithChildrenOnly) => (
  <span className='inline-text-emoji' data-testid='inline-text-emoji'>
    {children}
  </span>
);
