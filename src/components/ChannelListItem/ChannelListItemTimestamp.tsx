import React, { useMemo } from 'react';
import type { LocalMessage } from 'stream-chat';

import { useTranslationContext } from '../../context/TranslationContext';
import { getDateString } from '../../i18n/utils';
import { convertTimestampToDate } from 'stream-chat';

export type ChannelListItemTimestampProps = {
  /** Message whose `created_at` is shown. */
  previewedMessage?: LocalMessage;
};

export function ChannelListItemTimestamp({
  previewedMessage,
}: ChannelListItemTimestampProps) {
  const { t, tDateTimeParser } = useTranslationContext();

  const timestamp = previewedMessage?.created_at;
  // `created_at` can be a wire timestamp (a number), not a `Date`, so it is converted.
  const normalizedTimestamp =
    timestamp != null ? convertTimestampToDate(timestamp)?.toISOString() : undefined;

  const when = useMemo(
    () =>
      getDateString({
        messageCreatedAt: normalizedTimestamp,
        t,
        tDateTimeParser,
        timestampTranslationKey: 'timestamp.ChannelPreviewTimestamp',
      }),
    [normalizedTimestamp, t, tDateTimeParser],
  );

  if (!when) return null;

  return (
    <time
      className='str-chat__channel-list-item-timestamp'
      dateTime={normalizedTimestamp}
    >
      {when}
    </time>
  );
}
