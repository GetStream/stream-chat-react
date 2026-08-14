import React, { useMemo } from 'react';
import type { LocalMessage } from 'stream-chat';

import { useTranslationContext } from '../../context/TranslationContext';
import { getDateString, isDate } from '../../i18n/utils';

export type ChannelListItemTimestampProps = {
  /** The message previewed by the item, used to extract the timestamp */
  previewedMessage?: LocalMessage;
};

export function ChannelListItemTimestamp({
  previewedMessage,
}: ChannelListItemTimestampProps) {
  const { t, tDateTimeParser } = useTranslationContext('ChannelListItemTimestamp');

  const timestamp = previewedMessage?.created_at;
  const normalizedTimestamp =
    timestamp && isDate(timestamp) ? timestamp.toISOString() : undefined;

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
