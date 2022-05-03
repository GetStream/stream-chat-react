import React from 'react';

import { useTranslationContext } from '../../context/TranslationContext';
import { getDateString } from '../../i18n/utils';

export type DateSeparatorProps = {
  /** The date to format */
  date: Date;
  /** Override the default formatting of the date. This is a function that has access to the original date object. */
  formatDate?: (date: Date) => string;
  /** Set the position of the date in the separator, options are 'left', 'center', 'right', @default right */
  position?: 'left' | 'center' | 'right';
  /** If following messages are not new */
  unread?: boolean;
};

const UnMemoizedDateSeparator = (props: DateSeparatorProps) => {
  const { date: messageCreatedAt, formatDate, position = 'right', unread } = props;

  const { t, tDateTimeParser } = useTranslationContext('DateSeparator');

  const formattedDate = getDateString({
    calendar: true,
    formatDate,
    messageCreatedAt,
    tDateTimeParser,
  });

  return (
    <div className='str-chat__date-separator'>
      {(position === 'right' || position === 'center') && (
        <hr className='str-chat__date-separator-line' />
      )}
      <div className='str-chat__date-separator-date'>
        {unread ? `${t('New')} - ${formattedDate}` : formattedDate}
      </div>
      {(position === 'left' || position === 'center') && (
        <hr className='str-chat__date-separator-line' />
      )}
    </div>
  );
};

/**
 * A simple date separator between messages.
 */
export const DateSeparator = React.memo(UnMemoizedDateSeparator) as typeof UnMemoizedDateSeparator;
