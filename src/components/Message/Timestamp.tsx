import React, { useContext, useMemo } from 'react';

import { MessageContext } from '../../context/MessageContext';
import { useTranslationContext } from '../../context/TranslationContext';
import { getDateString } from '../../i18n/utils';
import { toIsoString } from '../../utils/timestamps';
import type { TimestampFormatterOptions } from '../../i18n/types';

export interface TimestampProps extends TimestampFormatterOptions {
  /* Adds a CSS class name to the component's outer `time` container. */
  customClass?: string;
  /* Timestamp to display, as a wire timestamp (unix nanoseconds) — the shape every server-sent
   * date field carries. */
  timestamp?: number;
}

export function Timestamp(props: TimestampProps) {
  const { calendar, calendarFormats, customClass, format, timestamp } = props;

  // also rendered outside a message (channel list items, composer previews)
  const { formatDate } = useContext(MessageContext) ?? {};
  const { t, tDateTimeParser } = useTranslationContext();

  // `getDateString` reads the wire timestamp directly. The `dateTime`/`title` attributes cannot:
  // they need a machine-readable string, and `when` below is localized display text.
  const normalizedTimestamp = toIsoString(timestamp);

  const when = useMemo(
    () =>
      getDateString({
        calendar,
        calendarFormats,
        format,
        formatDate,
        messageCreatedAt: timestamp,
        t,
        tDateTimeParser,
        timestampTranslationKey: 'timestamp.MessageTimestamp',
      }),
    [calendar, calendarFormats, format, formatDate, t, tDateTimeParser, timestamp],
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
