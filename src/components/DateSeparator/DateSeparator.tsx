import React from 'react';

import {
  isDayjs,
  useTranslationContext,
} from '../../context/TranslationContext';

export type DateSeparatorProps = {
  /** The date to format */
  date: Date;
  /** Override the default formatting of the date. This is a function that has access to the original date object. */
  formatDate?: (date: Date) => string;
  /** Set the position of the date in the separator, options are 'left', 'center', 'right' and default is 'right' */
  position?: 'left' | 'center' | 'right';
  /** If following messages are not new */
  unread?: boolean;
};

const UnMemoizedDateSeparator = (props: DateSeparatorProps) => {
  const { date, formatDate, position = 'right', unread } = props;

  const { t, tDateTimeParser } = useTranslationContext();

  if (typeof date === 'string') return null;

  const parsedDate = tDateTimeParser(date.toISOString());

  const formattedDate = formatDate
    ? formatDate(date)
    : isDayjs(parsedDate)
    ? parsedDate.calendar()
    : parsedDate;

  return (
    <div className='str-chat__date-separator'>
      {(position === 'right' || position === 'center') && (
        <hr className='str-chat__date-separator-line' />
      )}
      <div className='str-chat__date-separator-date'>
        {unread ? t('New') : formattedDate}
      </div>
      {(position === 'left' || position === 'center') && (
        <hr className='str-chat__date-separator-line' />
      )}
    </div>
  );
};

/**
 * DateSeparator - A simple date separator
 * @example ./DateSeparator.md
 */
export const DateSeparator = React.memo(
  UnMemoizedDateSeparator,
) as typeof UnMemoizedDateSeparator;
