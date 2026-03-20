import React, { useMemo } from 'react';
import type { LocalMessage } from 'stream-chat';

import { useTranslationContext } from '../../context/TranslationContext';
import { getDateString, isDate } from '../../i18n/utils';

export type ChannelListItemTimestampProps = {
  /** The last message in the channel, used to extract the timestamp */
  lastMessage?: LocalMessage;
};

export function ChannelListItemTimestamp({ lastMessage }: ChannelListItemTimestampProps) {
  const { t, tDateTimeParser } = useTranslationContext('ChannelListItemTimestamp');

  const timestamp = lastMessage?.created_at;
  const normalizedTimestamp =
    timestamp && isDate(timestamp) ? timestamp.toISOString() : undefined;

  const when = useMemo(
    () =>
      getDateString({
        messageCreatedAt: normalizedTimestamp,
        t,
        tDateTimeParser,
        timestampTranslationKey: 'timestamp/ChannelPreviewTimestamp',
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
