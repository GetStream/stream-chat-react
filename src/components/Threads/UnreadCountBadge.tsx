import clsx from 'clsx';
import React from 'react';
import type { PropsWithChildren } from 'react';

export const UnreadCountBadge = ({
  children,
  count,
  position,
}: PropsWithChildren<{
  count: number;
  position?: 'top-right' | 'bottom-right' | 'bottom-left' | 'top-left';
}>) => (
  <div className='str-chat__unread-count-badge-container'>
    {children}
    {count > 0 && (
      <div
        className={clsx(
          'str-chat__unread-count-badge',
          position && `str-chat__unread-count-badge--${position}`,
        )}
      >
        {count}
      </div>
    )}
  </div>
);
