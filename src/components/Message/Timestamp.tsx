import clsx from 'clsx';
import React, { useMemo } from 'react';

import { useMessageContext } from '../../context/MessageContext';
import { isDate, useTranslationContext } from '../../context/TranslationContext';
import { getDateString, TimestampFormatterOptions } from '../../i18n/utils';

export interface TimestampProps extends TimestampFormatterOptions {
  /* Adds a CSS class name to the component's outer `time` container. */
  customClass?: string;
  /* Timestamp to display */
  timestamp?: Date | string;
}

export const defaultTimestampFormat = 'h:mmA';

export function Timestamp(props: TimestampProps) {
  const {
    calendar,
    calendarFormats,
    customClass,
    format = defaultTimestampFormat,
    timestamp,
  } = props;

  const { formatDate } = useMessageContext('MessageTimestamp');
  const { t, tDateTimeParser } = useTranslationContext('MessageTimestamp');

  const normalizedTimestamp = timestamp && isDate(timestamp) ? timestamp.toISOString() : timestamp;

  const when = useMemo(
    () =>
      getDateString({
        calendar,
        calendarFormats,
        format,
        formatDate,
        messageCreatedAt: normalizedTimestamp,
        t,
        tDateTimeParser,
        timestampTranslationKey: 'timestamp/Timestamp',
      }),
    [calendar, calendarFormats, format, formatDate, normalizedTimestamp, t, tDateTimeParser],
  );

  if (!when) {
    return null;
  }

  return (
    <time className={clsx(customClass)} dateTime={normalizedTimestamp} title={normalizedTimestamp}>
      {when}
    </time>
  );
}
