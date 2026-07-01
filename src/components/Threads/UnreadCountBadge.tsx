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
  // Decorative, visual-only: the numeric badge duplicates a count that the consumer must expose via
  // an accessible name (e.g. the threads selector button's aria-label already includes the unread
  // count). Hidden from AT so the wrapper is not surfaced as a stray "group" around the button icon,
  // and so the count is not announced twice.
  <div aria-hidden='true' className='str-chat__unread-count-badge-container'>
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
