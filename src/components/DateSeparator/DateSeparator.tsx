import clsx from 'clsx';
import React from 'react';

import { useTranslationContext } from '../../context/TranslationContext';
import { getDateString } from '../../i18n/utils';

import type { TimestampFormatterOptions } from '../../i18n/types';

export type DateSeparatorProps = TimestampFormatterOptions & {
  /** Optional className for the root element */
  className?: string;
  /** The date to format */
  date: Date;
  /** When true, applies floating positioning (fixed at top when scrolling) */
  floating?: boolean;
  /** Override the default formatting of the date. This is a function that has access to the original date object. */
  formatDate?: (date: Date) => string;
  // todo: position and unread are not necessary anymore
  /** Set the position of the date in the separator, options are 'left', 'center', 'right', @default right */
  position?: 'left' | 'center' | 'right';
  /** If following messages are not new */
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

  const { t, tDateTimeParser } = useTranslationContext('DateSeparator');

  const formattedDate = getDateString({
    calendar,
    ...restTimestampFormatterOptions,
    formatDate,
    messageCreatedAt,
    t,
    tDateTimeParser,
    timestampTranslationKey: 'timestamp/DateSeparator',
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

/**
 * A simple date separator between messages.
 */
export const DateSeparator = React.memo(
  UnMemoizedDateSeparator,
) as typeof UnMemoizedDateSeparator;
