import React, { useMemo } from 'react';

import { useMessageContext } from '../../context/MessageContext';
import { isDate, useTranslationContext } from '../../context/TranslationContext';
import { getDateString } from '../../i18n/utils';

export interface TimestampProps {
  /* If true, call the `Day.js` calendar function to get the date string to display. */
  calendar?: boolean;
  /* Adds a CSS class name to the component's outer `time` container. */
  customClass?: string;
  /* Overrides the default timestamp format */
  format?: string;
  /* Timestamp to display */
  timestamp?: Date | string;
}

export const defaultTimestampFormat = 'h:mmA';

export function Timestamp(props: TimestampProps) {
  const { timestamp, calendar = false, customClass = '', format = defaultTimestampFormat } = props;

  const { formatDate } = useMessageContext('MessageTimestamp');
  const { tDateTimeParser } = useTranslationContext('MessageTimestamp');

  const normalizedTimestamp = timestamp && isDate(timestamp) ? timestamp.toISOString() : timestamp;

  const when = useMemo(
    () =>
      getDateString({
        calendar,
        format,
        formatDate,
        messageCreatedAt: normalizedTimestamp,
        tDateTimeParser,
      }),
    [formatDate, calendar, tDateTimeParser, format, normalizedTimestamp],
  );

  if (!when) {
    return null;
  }

  return (
    <time className={customClass} dateTime={normalizedTimestamp} title={normalizedTimestamp}>
      {when}
    </time>
  );
}
