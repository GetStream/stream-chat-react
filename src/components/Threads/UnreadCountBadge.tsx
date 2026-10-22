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
  // Only the badge is hidden from assistive tech, because the consumer already conveys the count
  // in an accessible name (e.g. the threads selector's `aria-label`) and it would be read twice.
  <div className='str-chat__unread-count-badge-container'>
    {children}
    {count > 0 && (
      <div
        aria-hidden='true'
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
