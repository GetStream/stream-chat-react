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
  // The wrapper stays in the a11y tree so arbitrary `children` remain exposed. Only the numeric
  // badge is hidden: it duplicates a count the consumer must already convey via an accessible name
  // (e.g. the threads selector button's aria-label includes the unread count), so exposing it would
  // announce the number twice.
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
