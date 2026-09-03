import React, { useMemo } from 'react';
import type { LocalMessage } from 'stream-chat';

import { useTranslationContext } from '../../context/TranslationContext';
import { getDateString } from '../../i18n/utils';
import { convertTimestampToDate } from 'stream-chat';

export type ChannelListItemTimestampProps = {
  /** The message previewed by the item, used to extract the timestamp */
  previewedMessage?: LocalMessage;
};

export function ChannelListItemTimestamp({
  previewedMessage,
}: ChannelListItemTimestampProps) {
  const { t, tDateTimeParser } = useTranslationContext();

  const timestamp = previewedMessage?.created_at;
  // `isDate` correctly reports that a wire number is not a `Date`, so the old idiom here returned
  // `undefined` for every message and the timestamp vanished from the list. Convert instead.
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
