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

  // Rendered both inside a message and standalone, so the message context is genuinely
  // optional here — read the context directly rather than through the throwing hook.
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
