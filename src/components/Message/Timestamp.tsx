import React, { useContext, useMemo } from 'react';

import { MessageContext } from '../../context/MessageContext';
import { useTranslationContext } from '../../context/TranslationContext';
import { getDateString, isDate } from '../../i18n/utils';
import type { TimestampFormatterOptions } from '../../i18n/types';

export interface TimestampProps extends TimestampFormatterOptions {
  /** Class name for the outer `time` element. */
  customClass?: string;
  timestamp?: Date | string;
}

export function Timestamp(props: TimestampProps) {
  const { calendar, calendarFormats, customClass, format, timestamp } = props;

  // Also renders outside a message (e.g. search results, thread list items).
  const { formatDate } = useContext(MessageContext) ?? {};
  const { t, tDateTimeParser } = useTranslationContext();

  const normalizedTimestamp =
    timestamp && isDate(timestamp) ? timestamp.toISOString() : timestamp;

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
        timestampTranslationKey: 'timestamp.MessageTimestamp',
      }),
    [
      calendar,
      calendarFormats,
      format,
      formatDate,
      normalizedTimestamp,
      t,
      tDateTimeParser,
    ],
  );

  if (!when) {
    return null;
  }

  return (
    <time
      className={customClass}
      dateTime={normalizedTimestamp}
      title={normalizedTimestamp}
    >
      {when}
    </time>
  );
}
