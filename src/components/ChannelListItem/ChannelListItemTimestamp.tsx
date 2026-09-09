import React, { useMemo } from 'react';
import type { LocalMessage } from 'stream-chat';

import { useTranslationContext } from '../../context/TranslationContext';
import { getDateString } from '../../i18n/utils';
import { toIsoString } from '../../utils/timestamps';

export type ChannelListItemTimestampProps = {
  /** The message previewed by the item, used to extract the timestamp */
  previewedMessage?: LocalMessage;
};

export function ChannelListItemTimestamp({
  previewedMessage,
}: ChannelListItemTimestampProps) {
  const { t, tDateTimeParser } = useTranslationContext();

  const timestamp = previewedMessage?.created_at;

  const when = useMemo(
    () =>
      getDateString({
        messageCreatedAt: timestamp,
        t,
        tDateTimeParser,
        timestampTranslationKey: 'timestamp.ChannelPreviewTimestamp',
      }),
    [timestamp, t, tDateTimeParser],
  );

  if (!when) return null;

  return (
    <time
      className='str-chat__channel-list-item-timestamp'
      dateTime={toIsoString(timestamp)}
    >
      {when}
    </time>
  );
}
