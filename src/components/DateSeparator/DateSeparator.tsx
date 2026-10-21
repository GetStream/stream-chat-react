import clsx from 'clsx';
import React from 'react';

import { useTranslationContext } from '../../context/TranslationContext';
import { getDateString } from '../../i18n/utils';

import type { TimestampFormatterOptions } from '../../i18n/types';

export type DateSeparatorProps = TimestampFormatterOptions & {
  /** Class name added to the root element. */
  className?: string;
  /** The date to format. */
  date: Date;
  /** Positions the separator absolutely at the top of its container. */
  floating?: boolean;
  /** Replaces the default date formatting. */
  formatDate?: (date: Date) => string;
  // todo: position and unread are not necessary anymore
  /**
   * Has no effect: every position renders the same markup.
   * @default right
   */
  position?: 'left' | 'center' | 'right';
  /** Has no effect. */
  unread?: boolean;
};

const UnMemoizedDateSeparator = (props: DateSeparatorProps) => {
  const {
    calendar,
    className,
    date: messageCreatedAt,
    floating,
    formatDate,
    ...restTimestampFormatterOptions
  } = props;

  const { t, tDateTimeParser } = useTranslationContext();

  const formattedDate = getDateString({
    calendar,
    ...restTimestampFormatterOptions,
    formatDate,
    messageCreatedAt,
    t,
    tDateTimeParser,
    timestampTranslationKey: 'timestamp.DateSeparator',
  });

  return (
    <div
      className={clsx(
        'str-chat__date-separator',
        { 'str-chat__date-separator--floating': floating },
        className,
      )}
      data-date={messageCreatedAt.toISOString()}
      data-testid={floating ? 'floating-date-separator' : 'date-separator'}
    >
      <div className='str-chat__date-separator-date'>{formattedDate}</div>
    </div>
  );
};

/** A date separator between messages. */
export const DateSeparator = React.memo(
  UnMemoizedDateSeparator,
) as typeof UnMemoizedDateSeparator;
