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
  /* Lookup key in the language corresponding translations sheet to perform date formatting */
  timestampTranslationKey?: string;
}

export const defaultTimestampFormat = 'h:mmA';

export function Timestamp(props: TimestampProps) {
  const {
    calendar,
    customClass,
    format = defaultTimestampFormat,
    timestamp,
    timestampTranslationKey = 'timestamp/Timestamp',
  } = props;

  const { formatDate } = useMessageContext('MessageTimestamp');
  const { t, tDateTimeParser } = useTranslationContext('MessageTimestamp');

  const normalizedTimestamp = timestamp && isDate(timestamp) ? timestamp.toISOString() : timestamp;

  const when = useMemo(
    () =>
      getDateString({
        calendar,
        format,
        formatDate,
        messageCreatedAt: normalizedTimestamp,
        t,
        tDateTimeParser,
        timestampTranslationKey,
      }),
    [
      calendar,
      format,
      formatDate,
      normalizedTimestamp,
      t,
      tDateTimeParser,
      timestampTranslationKey,
    ],
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
