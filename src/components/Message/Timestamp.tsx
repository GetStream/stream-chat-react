import React, { useContext, useMemo } from 'react';

import { MessageContext } from '../../context/MessageContext';
import { useTranslationContext } from '../../context/TranslationContext';
import { getDateString, isDate } from '../../i18n/utils';
import type { TimestampFormatterOptions } from '../../i18n/types';

export interface TimestampProps extends TimestampFormatterOptions {
  /* Adds a CSS class name to the component's outer `time` container. */
  customClass?: string;
  /* Timestamp to display */
  timestamp?: Date | string;
}

export function Timestamp(props: TimestampProps) {
  const { calendar, calendarFormats, customClass, format, timestamp } = props;

  // also rendered outside a message (channel list items, composer previews)
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
